"use client";

import {
  forwardRef,
  type CSSProperties,
  type ForwardedRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  createOrba,
  type OrbaDomControls,
  type OrbaDomInstance,
  type OrbaDomItem,
  type OrbaDomPosition,
  type OrbaDomProjection,
} from "./dom/index.js";
import type { OrbaPlacement } from "./core/index.js";

export type OrbaRenderState<TItem extends OrbaDomItem> = {
  selected: boolean;
  front: boolean;
  visible: boolean;
  visibility: number;
  projection: OrbaDomProjection<TItem> | null;
  select: () => void;
};

export type OrbaProps<TItem extends OrbaDomItem> = {
  items: TItem[];
  radius?: number;
  perspective?: number;
  rotation?: {
    x: number;
    y: number;
  };
  zoom?: number;
  placement?: OrbaPlacement;
  controls?: OrbaDomControls;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  className?: string;
  style?: CSSProperties;
  getItemPosition?: (
    item: TItem,
    index: number,
    items: TItem[],
  ) => OrbaDomPosition | null | undefined;
  getItemSize?: (item: TItem, index: number, items: TItem[]) => number;
  renderItem: (item: TItem, state: OrbaRenderState<TItem>) => ReactNode;
  onSelect?: (item: TItem) => void;
};

export type OrbaHandle<TItem extends OrbaDomItem = OrbaDomItem> =
  OrbaDomInstance<TItem>;

const OrbaInner = <TItem extends OrbaDomItem>(
  {
    items,
    radius,
    perspective,
    rotation,
    zoom,
    placement,
    controls = true,
    selectedId,
    defaultSelectedId = null,
    className,
    style,
    getItemPosition,
    getItemSize,
    renderItem,
    onSelect,
  }: OrbaProps<TItem>,
  ref: ForwardedRef<OrbaHandle<TItem>>,
) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const itemElementsRef = useRef(new Map<string, HTMLElement>());
  const instanceRef = useRef<OrbaDomInstance<TItem> | null>(null);
  const latestSelectRef = useRef({ onSelect, selectedId });
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    defaultSelectedId,
  );
  const [, setRevision] = useState(0);
  const effectiveSelectedId = selectedId ?? internalSelectedId;

  latestSelectRef.current = { onSelect, selectedId };

  useImperativeHandle(
    ref,
    () => ({
      update: (patch) => instanceRef.current?.update(patch),
      destroy: () => instanceRef.current?.destroy(),
      project: (id) => instanceRef.current?.project(id) ?? null,
      getState: () => {
        const state = instanceRef.current?.getState();
        if (!state) {
          throw new Error("Orba is not mounted.");
        }
        return state;
      },
      subscribe: (listener) =>
        instanceRef.current?.subscribe(listener) ?? (() => undefined),
    }),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const instance = createOrba<TItem>(root, {
      items: [],
      getElement: (item) => itemElementsRef.current.get(item.id) ?? null,
      onSelect: (item) => {
        const latest = latestSelectRef.current;
        if (latest.selectedId === undefined) setInternalSelectedId(item.id);
        latest.onSelect?.(item);
      },
    });

    instanceRef.current = instance;
    const unsubscribe = instance.subscribe(() =>
      setRevision((revision) => revision + 1),
    );
    setRevision((revision) => revision + 1);

    return () => {
      unsubscribe();
      instance.destroy();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    instanceRef.current?.update({
      items,
      radius,
      perspective,
      rotation,
      zoom,
      placement,
      controls,
      selectedId: effectiveSelectedId,
      getItemPosition,
      getItemSize,
    });
  }, [
    controls,
    effectiveSelectedId,
    getItemPosition,
    getItemSize,
    items,
    perspective,
    placement,
    radius,
    rotation,
    zoom,
  ]);

  return (
    <div ref={rootRef} className={className} style={style} data-orba-react>
      {items.map((item) => {
        const projection = instanceRef.current?.project(item.id) ?? null;
        const itemSelected = effectiveSelectedId === item.id;
        const renderState: OrbaRenderState<TItem> = {
          selected: itemSelected,
          front: projection?.front ?? false,
          visible: Boolean(projection?.front),
          visibility: projection?.visibility ?? 0,
          projection,
          select: () => {
            if (selectedId === undefined) setInternalSelectedId(item.id);
            instanceRef.current?.update({ selectedId: item.id });
            onSelect?.(item);
          },
        };

        return (
          <div
            key={item.id}
            ref={(element) => {
              if (element) {
                itemElementsRef.current.set(item.id, element);
              } else {
                itemElementsRef.current.delete(item.id);
              }
            }}
            data-orba-slot={item.id}
          >
            {renderItem(item, renderState)}
          </div>
        );
      })}
    </div>
  );
};

export const Orba = forwardRef(OrbaInner) as <TItem extends OrbaDomItem>(
  props: OrbaProps<TItem> & {
    ref?: ForwardedRef<OrbaHandle<TItem>>;
  },
) => ReactNode;
