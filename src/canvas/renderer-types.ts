import type { SpherCanvasItem, SpherCanvasRenderState } from "./types.js"

export type SpherCanvasRenderer<TItem extends SpherCanvasItem = SpherCanvasItem> = (
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherCanvasRenderState<TItem>,
) => void

export type SpherCanvasPreloadableRenderer<TItem extends SpherCanvasItem = SpherCanvasItem> =
  SpherCanvasRenderer<TItem> & {
    preload: (items: TItem[], onLoad?: () => void) => void
  }

export type SpherCanvasImageSource = string | HTMLImageElement | null | undefined

export type SpherCanvasColorPair = readonly [string, string]
