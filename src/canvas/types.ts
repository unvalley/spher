import type { PositionedItem, ProjectedItem, SpherItemBase, SpherPlacement } from "../core/types.js"

export type SpherCanvasPosition = {
  latitude: number
  longitude: number
}

export type SpherCanvasItem = SpherItemBase

export type SpherCanvasViewMode = "inside" | "shell"

export type SpherCanvasControls =
  | boolean
  | {
      autoRotate?: boolean | { speed?: number }
      drag?: boolean
      keyboard?: boolean
      wheel?: boolean
      preventDocumentScroll?: boolean
    }

export type SpherCanvasRenderState<TItem extends SpherCanvasItem = SpherCanvasItem> = {
  item: PositionedItem<TItem>
  edgeFactor: number
  front: boolean
  normalY: number
  perspectiveScale: number
  selected: boolean
  visibility: number
  viewMode: SpherCanvasViewMode
}

export type SpherCanvasOptions<TItem extends SpherCanvasItem = SpherCanvasItem> = {
  items: TItem[]
  /** Sphere radius in CSS pixels. `"auto"` tracks the canvas's shorter side. */
  radius?: number | "auto"
  perspective?: number
  rotation?: {
    x: number
    y: number
  }
  zoom?: number
  insideZoomThreshold?: number
  minZoom?: number
  maxZoom?: number
  placement?: SpherPlacement
  controls?: SpherCanvasControls
  selectedId?: string | null
  devicePixelRatio?: number
  position?: (item: TItem, index: number, items: TItem[]) => SpherCanvasPosition | null | undefined
  /** Card size in CSS pixels. `"auto"` derives from the resolved radius. */
  size?: number | "auto" | ((item: TItem, index: number, items: TItem[]) => number)
  render?: (
    context: CanvasRenderingContext2D,
    item: TItem,
    state: SpherCanvasRenderState<TItem>,
  ) => void
  onSelect?: (item: TItem) => void
}

export type SpherCanvasState<TItem extends SpherCanvasItem = SpherCanvasItem> = {
  items: TItem[]
  radius: number
  perspective: number
  rotation: {
    x: number
    y: number
  }
  zoom: number
  insideZoomProgress: number
  insideZoomThreshold: number
  insideSceneScale: number
  sceneZoom: number
  minZoom: number
  maxZoom: number
  placement: SpherPlacement
  selectedId: string | null
  devicePixelRatio: number
  viewMode: SpherCanvasViewMode
}

export type SpherCanvasProjection<TItem extends SpherCanvasItem = SpherCanvasItem> =
  ProjectedItem<TItem> & {
    front: boolean
    selected: boolean
    visibility: number
    viewMode: SpherCanvasViewMode
  }

export type SpherCanvasListener<TItem extends SpherCanvasItem = SpherCanvasItem> = (
  state: SpherCanvasState<TItem>,
) => void

export type SpherCanvasInstance<TItem extends SpherCanvasItem = SpherCanvasItem> = {
  update: (patch: Partial<SpherCanvasOptions<TItem>>) => void
  select: (id: string | null) => void
  rotateTo: (rotation: SpherCanvasState<TItem>["rotation"]) => void
  destroy: () => void
  itemState: (id: string) => SpherCanvasRenderState<TItem> | null
  getState: () => SpherCanvasState<TItem>
  subscribe: (listener: SpherCanvasListener<TItem>) => () => void
}
