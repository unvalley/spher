import type { PositionedItem, ProjectedItem, SpherItemBase, SpherPlacement } from "../core/types.js"

export type SpherCanvasPosition = {
  latitude: number
  longitude: number
}

export type SpherCanvasItem = SpherItemBase

export type SpherCanvasViewMode = "inside" | "shell"

export type SpherCanvasFaceMode = "face-out" | "face-in"

export type SpherCanvasSurfaceSide = "outside" | "inside"

export type SpherCanvasTilt =
  | number
  | {
      /** Pitch offset in degrees, applied before user rotation. */
      x?: number
      /** Yaw offset in degrees, applied before user rotation. */
      y?: number
      /** Roll offset in degrees, useful for visually leaning the sphere. */
      z?: number
    }

export type SpherCanvasResolvedTilt = {
  x: number
  y: number
  z: number
}

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
  faceMode: SpherCanvasFaceMode
  front: boolean
  imageVisible: boolean
  normalY: number
  perspectiveScale: number
  selected: boolean
  visibleSide: SpherCanvasSurfaceSide
  visibility: number
  viewMode: SpherCanvasViewMode
}

export type SpherCanvasAutoSize = {
  /** Size-to-diameter ratio used for responsive surface sizing. Defaults to 0.1. */
  ratio?: number
  /** Minimum resolved surface size in CSS pixels. */
  min?: number
  /** Maximum resolved surface size in CSS pixels. */
  max?: number
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
  tilt?: SpherCanvasTilt
  zoom?: number
  insideZoomThreshold?: number
  minZoom?: number
  maxZoom?: number
  /** Which side of each surface shows the main image. */
  faceMode?: SpherCanvasFaceMode
  placement?: SpherPlacement
  controls?: SpherCanvasControls
  selectedId?: string | null
  devicePixelRatio?: number
  position?: (item: TItem, index: number, items: TItem[]) => SpherCanvasPosition | null | undefined
  /** Surface size in CSS pixels. `"auto"` derives from the resolved radius. */
  size?:
    | number
    | "auto"
    | SpherCanvasAutoSize
    | ((item: TItem, index: number, items: TItem[]) => number)
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
  tilt: SpherCanvasResolvedTilt
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
  faceMode: SpherCanvasFaceMode
  viewMode: SpherCanvasViewMode
}

export type SpherCanvasProjection<TItem extends SpherCanvasItem = SpherCanvasItem> =
  ProjectedItem<TItem> & {
    faceMode: SpherCanvasFaceMode
    front: boolean
    imageVisible: boolean
    selected: boolean
    visibleSide: SpherCanvasSurfaceSide
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
