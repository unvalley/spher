# orba 設計変更案

## 背景

orba は「球体のようなコンポーネントを簡単に使える」ライブラリを目指している。一方、現在の実装は `SphericalArchive` という完成済みの全画面アーカイブ UI が中心で、球面配置のコア機能とアプリ固有の UI が強く結合している。

理想像として近い COBE は、`canvas` と設定を渡してインスタンスを作り、`update` と `destroy` で制御する薄い命令型 API を持つ。さらに、マーカーやアークには `id` を与えられ、CSS Anchor Positioning で任意の DOM 要素を外付けできる。つまり COBE は「完成 UI」ではなく「球体表現のエンジン」を提供している。

orba も同じ方向に寄せるなら、主 API を `SphericalArchive` から「球面レイアウトとインタラクションのヘッドレスエンジン」へ移し、React は薄いアダプタにするのがよい。

参考:

- [COBE src](https://github.com/shuding/cobe/tree/main/src)
- [COBE README](https://github.com/shuding/cobe/blob/main/README.md)

## 現状の課題

### 1. ライブラリの中心が用途特化 UI になっている

現在の公開 API は `SphericalArchive` が主役で、`items` は `id`, `title`, `image`, `year` を必須にしている。これは「画像アーカイブ」には便利だが、ユーザーが任意のカード、ボタン、ラベル、プロダクト、人物、ノードを球面上に置きたい場合には制約が強い。

### 2. React の再レンダーと球体操作が密結合している

ドラッグ、ホイール、キーボード操作、投影、可視判定、ヒットテスト、選択状態、フィルタ UI、詳細パネルが `SphericalArchive.tsx` に集まっている。球体の回転は本来フレーム単位で DOM transform を更新できる処理だが、React コンポーネントの状態管理と同じ層にあるため、将来のパフォーマンス最適化や他フレームワーク対応が難しい。

### 3. スタイリングが Tailwind 前提

README に Tailwind の content 設定が必要と書かれている。低レベルライブラリとしては、利用側の CSS フレームワークに依存しないほうが扱いやすい。COBE のような「見た目はユーザーが自由に作る」方向にするなら、orba 側は最小限の CSS 変数と transform だけを提供するべき。

### 4. core と orba の境界が曖昧

`src/core` に配置計算がある一方、`src/orba` には `ArchiveCard`, `FilterRow`, `imagePreload` など UI 固有の実装が置かれている。`orba` という名前空間が「ライブラリのコア」なのか「アーカイブ UI の部品」なのか読み取りにくい。

## 目標設計

orba の中心を、次の 3 層に分ける。

```txt
orba
├─ core        球面座標、投影、可視判定、ヒットテスト、状態更新
├─ dom         DOM 要素を球面上に配置する軽量レンダラ
├─ react       React 用の薄いラッパーと hook
└─ presets     SphericalArchive など用途特化 UI
```

### 設計原則

- 低レベル API を主役にする
- React を必須にしない
- DOM ノードの中身はユーザーに任せる
- アニメーション中の更新は React 再レンダーに依存しない
- 配置、投影、入力制御、描画を分離する
- スタイルは Tailwind ではなく CSS 変数と data 属性で表現する
- 既存の `SphericalArchive` は廃止ではなく preset に移す

## 新しい公開 API 案

### 1. 命令型 DOM API

COBE に近い、最小のエントリポイントを用意する。

```ts
import { createOrba } from "orba";

const orba = createOrba(container, {
  radius: 360,
  perspective: 900,
  rotation: { x: 0, y: 0 },
  items: [
    { id: "a", position: { latitude: 35.6, longitude: 139.7 }, size: 72 },
    { id: "b", placementIndex: 1, size: 96 },
  ],
  placement: "fibonacci",
  controls: {
    drag: true,
    wheel: true,
    keyboard: true,
    inertia: true,
  },
});

orba.update({
  rotation: { x: 12, y: 40 },
});

orba.destroy();
```

返り値:

```ts
type OrbaInstance<TItem = OrbaItem> = {
  update: (patch: Partial<OrbaOptions<TItem>>) => void;
  destroy: () => void;
  project: (id: string) => OrbaProjection | null;
  getState: () => OrbaState<TItem>;
  subscribe: (listener: OrbaListener<TItem>) => () => void;
};
```

### 2. DOM スロット API

ユーザーが自分の DOM を渡し、その DOM を orba が transform する。

```ts
const orba = createOrba(container, {
  items,
  getElement: (item) => document.querySelector(`[data-node="${item.id}"]`),
});
```

または orba 側でスロットを作る。

```ts
const orba = createOrba(container, {
  items,
  renderItem: (item, slot) => {
    slot.textContent = item.label;
    slot.className = "node";
  },
});
```

orba は各要素に CSS 変数と data 属性を設定する。

```css
.node {
  transform:
    translate3d(var(--orba-x), var(--orba-y), 0)
    scale(var(--orba-scale));
  opacity: var(--orba-opacity);
  pointer-events: var(--orba-interactive);
}
```

設定される値の例:

```txt
--orba-x
--orba-y
--orba-z
--orba-scale
--orba-visibility
--orba-edge
--orba-depth
--orba-selected
data-orba-item
data-orba-visible
data-orba-front
```

### 3. React API

React は stateful な球体そのものを持たず、DOM API のラッパーにする。

```tsx
import { OrbaSphere } from "orba/react";

<OrbaSphere
  items={items}
  radius={360}
  renderItem={(item, state) => (
    <button data-active={state.selected}>
      {item.label}
    </button>
  )}
  onSelect={(item) => setSelected(item)}
/>;
```

低レベル hook も用意する。

```tsx
const { ref, instance, projections } = useOrba({
  items,
  controls: { drag: true, wheel: true },
});
```

ただし `projections` はデバッグや UI 連携用で、毎フレーム React state として更新しない。フレーム単位の transform は DOM レンダラが直接処理する。

## 型設計

現在の `SphericalArchiveItemBase` は用途が狭いので、低レベルでは次のような汎用型に変える。

```ts
type OrbaItem = {
  id: string;
  position?: {
    latitude: number;
    longitude: number;
  };
  placementIndex?: number;
  size?: number | { width: number; height: number };
  depthOffset?: number;
  data?: unknown;
};
```

配置済みアイテム:

```ts
type OrbaPlacedItem<TItem> = TItem & {
  id: string;
  latitude: number;
  longitude: number;
  normal: [number, number, number];
  position: [number, number, number];
  radius: number;
};
```

投影結果:

```ts
type OrbaProjection = {
  id: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  visibility: number;
  edge: number;
  front: boolean;
  interactive: boolean;
};
```

## モジュール設計

### `src/core`

副作用なしの純粋関数だけを置く。

```txt
src/core/
├─ coordinates.ts     lat/lon と xyz の変換
├─ placement.ts       fibonacci, grid, custom placement
├─ projection.ts      rotation, perspective, visibility
├─ hit-test.ts        pointer 座標から item を解決
├─ state.ts           update patch の正規化
└─ types.ts
```

ここは React も DOM も参照しない。

### `src/dom`

DOM に依存する処理をまとめる。

```txt
src/dom/
├─ create-orba.ts     createOrba の本体
├─ renderer.ts        element 作成、style 更新、CSS 変数反映
├─ controls.ts        pointer, wheel, keyboard, inertia
├─ resize.ts          ResizeObserver と DPR
├─ anchors.ts         CSS Anchor Positioning 連携
└─ types.ts
```

アニメーションループはここで閉じる。React state は使わない。

### `src/react`

React 固有の薄いアダプタだけを置く。

```txt
src/react/
├─ OrbaSphere.tsx
├─ useOrba.ts
└─ types.ts
```

`useEffect` で `createOrba` を作り、props 変更時に `instance.update` する。`renderItem` は slot に React portal するか、最初は wrapper 内に通常描画した子要素を `getElement` で渡す実装にする。

### `src/presets`

既存の `SphericalArchive` をここに移す。

```txt
src/presets/
└─ spherical-archive/
   ├─ SphericalArchive.tsx
   ├─ ArchiveCard.tsx
   ├─ FilterRow.tsx
   └─ types.ts
```

公開パスは互換性のため残す。

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./core": "./dist/core/index.js",
    "./dom": "./dist/dom/index.js",
    "./react": "./dist/react/index.js",
    "./presets/spherical-archive": "./dist/presets/spherical-archive/index.js",
    "./react/archive": "./dist/react/archive.js"
  }
}
```

## レンダリング方針

### 初期段階は CSS 3D / DOM でよい

COBE は WebGL だが、orba の価値が「球体のようなコンポーネントを簡単に使う」ことであれば、最初から WebGL に寄せすぎないほうがよい。任意の DOM コンポーネント、アクセシビリティ、フォーム要素、画像、動画、リンクをそのまま載せられることが orba の強みになる。

WebGL は将来の背景球、ドット球、発光、密な点群用の renderer として追加できる。

```txt
renderer: "dom"      任意 DOM コンポーネント向け。最初の主戦場。
renderer: "canvas"   背景球や大量点群向け。将来追加。
renderer: "webgl"    COBE に近い高密度表現向け。将来追加。
```

### 毎フレーム React setState しない

現在は回転状態を React state にコミットしつつ、ref で DOM transform も直接更新している。新設計では、回転と投影のフレーム更新は renderer が持つ。

React に通知するのは次のようなイベントだけにする。

- select
- hover
- settle
- viewMode change
- item visibility threshold change
- debug subscription

## インタラクション設計

`controls` を分離し、必要なものだけ有効化できるようにする。

```ts
controls: {
  drag?: boolean | DragControlOptions;
  wheel?: boolean | WheelControlOptions;
  keyboard?: boolean | KeyboardControlOptions;
  autoRotate?: boolean | AutoRotateOptions;
  inertia?: boolean | InertiaOptions;
}
```

`SphericalArchive` のような全画面体験では body scroll を止めたいが、通常のコンポーネント利用ではページスクロールを壊してはいけない。そのため `preventDocumentScroll` はデフォルト `false` にし、preset 側だけで有効化する。

## スタイリング設計

Tailwind クラスをパッケージ内部の前提にしない。低レベル API は CSS ファイルなしでも動き、必要なら最小 CSS を任意 import にする。

```ts
import "orba/styles.css";
```

CSS は次の程度に留める。

```css
.orba-root {
  position: relative;
  overflow: hidden;
  touch-action: none;
}

.orba-item {
  position: absolute;
  left: 50%;
  top: 50%;
  will-change: transform, opacity;
}
```

見た目のカード、影、色、余白はユーザー側または preset 側に置く。

## 既存 API の扱い

短期的には互換性を壊さない。

- `orba/core` は維持する
- `orba/react` の `SphericalArchive` export は維持する
- `SphericalArchive` の内部実装だけ新しい `OrbaSphere` に寄せる
- README では `createOrba` と `OrbaSphere` を主役にする
- `SphericalArchive` は「preset」として説明する

将来的には次のように位置付ける。

```ts
import { createOrba } from "orba";
import { OrbaSphere } from "orba/react";
import { SphericalArchive } from "orba/presets/spherical-archive";
```

## 実装順序

### Phase 1: core の整理

- `src/core/types.ts` から `SphericalArchive*` という名前を外す
- `positionItems` を `placeItems` に改名し、互換 alias を残す
- `projectItems`, `findNearestProjectedItem`, `selectVisibleItemIds` を `SphericalArchive.tsx` から `src/core` に移す
- `year` ソートを core から外し、並び順は呼び出し側に任せる
- `getItemSize` ではなく `size` resolver を options として統一する

### Phase 2: DOM engine の追加

- `createOrba(root, options)` を追加する
- requestAnimationFrame loop を DOM engine に持たせる
- item 要素に CSS 変数を反映する
- pointer/wheel/keyboard controls を `controls.ts` に分離する
- `update`/`destroy`/`project`/`subscribe` を返す

### Phase 3: React adapter の追加

- `OrbaSphere` を追加する
- `useOrba` を追加する
- React からは props 変更時に `instance.update` するだけにする
- 毎フレームの DOM transform は engine に任せる

### Phase 4: SphericalArchive の preset 化

- `SphericalArchive` を `src/presets/spherical-archive` に移す
- 内部の配置、投影、ヒットテスト、操作を `OrbaSphere` または `createOrba` に置き換える
- `ArchiveCard` と `FilterRow` は preset 内部に閉じる
- Tailwind 依存を preset の例または任意スタイルへ移す

### Phase 5: ドキュメントと examples

最低限、次の examples を用意する。

- `basic-dom`: 素の DOM 要素を球面配置する
- `react-cards`: React コンポーネントを配置する
- `labels`: CSS anchor / visibility 変数でラベル表示する
- `archive-preset`: 既存の SphericalArchive 相当
- `controlled-rotation`: 外部 state から回転を制御する

## README の主役を変える

現在の README は Core と React の例があるが、React archive の印象が強い。新設計後は次の順番にする。

1. `createOrba` の最小例
2. React の `OrbaSphere` 例
3. DOM slot / CSS variables の例
4. preset としての `SphericalArchive`
5. core utilities

## パッケージ方針

React を optional peer にしている点はよい。さらに exports を用途別に明確化する。

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./core": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js"
    },
    "./dom": {
      "types": "./dist/dom/index.d.ts",
      "import": "./dist/dom/index.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js"
    },
    "./presets/spherical-archive": {
      "types": "./dist/presets/spherical-archive/index.d.ts",
      "import": "./dist/presets/spherical-archive/index.js"
    },
    "./styles.css": "./dist/styles.css"
  }
}
```

## テスト設計

orba は「純粋な球面計算」と「実ブラウザの DOM 表現」の両方が重要なので、テストも実行環境を分ける。

### 1. Core tests

`src/core/**/*.test.ts` は Node 上の Vitest で実行する。対象は副作用のない関数に限定する。

検証すること:

- `placeItems` が `id` だけの汎用 item を配置できる
- explicit な latitude / longitude が正しい xyz に変換される
- fibonacci / grid placement が安定した件数と有限値を返す
- `projectItems` が rotation / zoom / perspective を反映する
- `findNearestProjectedItem` が中心に近い item を選ぶ
- edge / z / perspective scale が NaN にならない

ここでは DOM を使わない。計算結果を小さな数値範囲で検証し、ブラウザ差分を持ち込まない。

### 2. Browser-mode tests

`src/**/*.browser.test.ts` は Vitest browser mode + Playwright provider で Chromium 上に実行する。

検証すること:

- `createOrba(root, options)` が DOM slot を生成する
- 各 item に `data-orba-item`, `data-orba-visible`, `data-orba-selected` が付く
- `--orba-x`, `--orba-y`, `--orba-scale`, `--orba-visibility` が style に反映される
- `update` 後に既存 DOM を再利用し、projection だけが変わる
- visible item を click すると `onSelect` と `selectedId` が更新される
- `destroy` が生成 DOM と event listener を片付ける

ブラウザでしか信頼できない `HTMLElement.style`, event bubbling, pointer events, `getBoundingClientRect` 周辺はこの層で見る。

### 3. React adapter tests

`OrbaSphere` を追加した段階で browser-mode に React 統合テストを追加する。

検証すること:

- `renderItem` で React component を配置できる
- props の `items`, `rotation`, `selectedId` 変更が `instance.update` に反映される
- 毎フレーム React state 更新に依存していない
- unmount 時に `destroy` が呼ばれる

React Testing Library に寄せすぎず、最終的な DOM と orba instance の状態を見る。

### 4. Preset tests

`SphericalArchive` は preset として、低レベル engine より粗い統合テストにする。

検証すること:

- filter 操作で表示状態が変わる
- item click で detail context の selected が変わる
- zoom / placement / face direction の主要操作が壊れていない
- body scroll lock のような preset 固有の副作用が cleanup される

### 5. CI command

最低限の確認コマンドは次の 3 つにする。

```sh
pnpm run build
pnpm test
pnpm test:browser
```

`pnpm test` は Node 上の core tests、`pnpm test:browser` は Chromium 上の DOM/browser tests を実行する。ブラウザモードは Vitest の Playwright provider を使い、設定は `vitest.browser.config.ts` に閉じる。

## 目指す利用体験

orba は次のように説明できる状態を目指す。

> orba is a tiny sphere layout engine for DOM and React components. Place any element on a rotating sphere, control it with a small imperative API, and style everything yourself with CSS.

この位置付けなら、COBE の「小さく、速く、任意の DOM を外付けできる」という良さを取り込みつつ、orba 独自の価値として「WebGL globe ではなく、実際の UI コンポーネントを球面上に置ける」点を打ち出せる。

## 最初に着手すべき変更

最初の PR では大きく作り替えず、次の範囲に絞るのがよい。

1. `projectItems` と `findNearestProjectedItem` を `src/core` に移す
2. `SphericalArchiveItemBase` とは別に `OrbaItem` / `OrbaProjection` を追加する
3. `createOrba` の最小版を `src/dom` に追加する
4. README に `createOrba` の API 方針を追記する
5. 既存 `SphericalArchive` は壊さず、その内部で新 core 関数を使う

この順序なら既存利用者を壊さず、ライブラリの重心だけを低レベル API へ移せる。
