import type { PositionedItem, ProjectedItem, SpherItemBase, SpherPlacement } from "../core/types.js"

export type SpherPosition = {
  latitude: number
  longitude: number
}

export type SpherItem = SpherItemBase

export type SpherViewMode = "inside" | "shell"

export type SpherFaceMode = "face-out" | "face-in"

export type SpherSurfaceSide = "outside" | "inside"

export type SpherTilt =
  | number
  | {
      /** Pitch offset in degrees, applied before user rotation. */
      x?: number
      /** Yaw offset in degrees, applied before user rotation. */
      y?: number
      /** Roll offset in degrees, useful for visually leaning the sphere. */
      z?: number
    }

export type SpherResolvedTilt = {
  x: number
  y: number
  z: number
}

export type SpherControls =
  | boolean
  | {
      autoRotate?: boolean | { speed?: number }
      drag?: boolean
      keyboard?: boolean
      wheel?: boolean
      preventDocumentScroll?: boolean
    }

export type SpherRenderState<TItem extends SpherItem = SpherItem> = {
  item: PositionedItem<TItem>
  edgeFactor: number
  faceMode: SpherFaceMode
  front: boolean
  imageVisible: boolean
  normalY: number
  perspectiveScale: number
  selected: boolean
  visibleSide: SpherSurfaceSide
  visibility: number
  viewMode: SpherViewMode
}

export type SpherAutoSize = {
  /** Size-to-diameter ratio used for responsive surface sizing. Defaults to 0.1. */
  ratio?: number
  /** Minimum resolved surface size in CSS pixels. */
  min?: number
  /** Maximum resolved surface size in CSS pixels. */
  max?: number
}

export type SpherOptions<TItem extends SpherItem = SpherItem> = {
  items: TItem[]
  /** Sphere radius in CSS pixels. `"auto"` tracks the canvas's shorter side. */
  radius?: number | "auto"
  perspective?: number
  rotation?: {
    x: number
    y: number
  }
  tilt?: SpherTilt
  zoom?: number
  insideZoomThreshold?: number
  minZoom?: number
  maxZoom?: number
  /** Which side of each surface shows the main image. */
  faceMode?: SpherFaceMode
  placement?: SpherPlacement
  controls?: SpherControls
  selectedId?: string | null
  devicePixelRatio?: number
  position?: (item: TItem, index: number, items: TItem[]) => SpherPosition | null | undefined
  /** Surface size in CSS pixels. `"auto"` derives from the resolved radius. */
  size?:
    | number
    | "auto"
    | SpherAutoSize
    | ((item: TItem, index: number, items: TItem[]) => number)
  render?: (
    context: CanvasRenderingContext2D,
    item: TItem,
    state: SpherRenderState<TItem>,
  ) => void
  onSelect?: (item: TItem) => void
}

export type SpherState<TItem extends SpherItem = SpherItem> = {
  items: TItem[]
  radius: number
  perspective: number
  rotation: {
    x: number
    y: number
  }
  tilt: SpherResolvedTilt
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
  faceMode: SpherFaceMode
  viewMode: SpherViewMode
}

export type SpherProjection<TItem extends SpherItem = SpherItem> =
  ProjectedItem<TItem> & {
    faceMode: SpherFaceMode
    front: boolean
    imageVisible: boolean
    selected: boolean
    visibleSide: SpherSurfaceSide
    visibility: number
    viewMode: SpherViewMode
  }

export type SpherListener<TItem extends SpherItem = SpherItem> = (
  state: SpherState<TItem>,
) => void

export type SpherInstance<TItem extends SpherItem = SpherItem> = {
  update: (patch: Partial<SpherOptions<TItem>>) => void
  select: (id: string | null) => void
  rotateTo: (rotation: SpherState<TItem>["rotation"]) => void
  destroy: () => void
  itemState: (id: string) => SpherRenderState<TItem> | null
  getState: () => SpherState<TItem>
  subscribe: (listener: SpherListener<TItem>) => () => void
}
