import type { SpherItem, SpherRenderState } from "./types.js"

export type SpherRenderer<TItem extends SpherItem = SpherItem> = (
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherRenderState<TItem>,
) => void

export type SpherPreloadableRenderer<TItem extends SpherItem = SpherItem> = SpherRenderer<TItem> & {
  preload: (items: TItem[], onLoad?: () => void) => void
}

export type SpherCoverSource = string | CanvasImageSource | null | undefined

export type SpherColorPair = readonly [string, string]
