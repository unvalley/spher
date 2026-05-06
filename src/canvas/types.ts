import type { PositionedItem, ProjectedItem, SpherItemBase, SpherPlacement } from "../core/types.js"

export type SpherPosition = {
  latitude: number
  longitude: number
}

export type SpherItem = SpherItemBase

export type SpherViewMode = "inside" | "shell"

export type SpherFaceMode = "face-out" | "face-in"

export type SpherCardSide = "outside" | "inside"

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

export type SpherControls = {
  /** Continuously rotates the sphere. Pass an object to customize the frame step. */
  autoRotate?: boolean | { speed?: number }
  /** Enables pointer drag rotation. */
  drag?: boolean
  /** Enables arrow-key rotation and command-arrow zoom. */
  keyboard?: boolean
  /** Enables wheel rotation and modifier-wheel zoom. */
  wheel?: boolean
  /** Prevents page scroll while handling wheel input on the canvas. */
  preventDocumentScroll?: boolean
}

export type SpherRenderState<TItem extends SpherItem = SpherItem> = {
  item: PositionedItem<TItem>
  edgeFactor: number
  faceMode: SpherFaceMode
  front: boolean
  coverVisible: boolean
  normalY: number
  perspectiveScale: number
  selected: boolean
  visibleSide: SpherCardSide
  visibility: number
  viewMode: SpherViewMode
}

export type SpherAutoSize = {
  /** Size-to-diameter ratio used for responsive card sizing. Defaults to 0.1. */
  ratio?: number
  /** Minimum resolved card size in CSS pixels. */
  min?: number
  /** Maximum resolved card size in CSS pixels. */
  max?: number
}

export type SpherZoom = {
  /** Current zoom level. Defaults to 1. */
  value?: number
  /** Lower bound for interactive zoom. Defaults to 0.66. */
  min?: number
  /** Upper bound for interactive zoom. Defaults to 4.4. */
  max?: number
  /** Zoom level where rendering switches from shell view to inside view. Defaults to 1.32. */
  insideThreshold?: number
}

export type SpherResolvedZoom = {
  /** Current zoom level before inside-view remapping. */
  value: number
  /** Lower bound for interactive zoom. */
  min: number
  /** Upper bound for interactive zoom. */
  max: number
  /** Zoom level where rendering switches from shell view to inside view. */
  insideThreshold: number
}

export type SpherOptions<TItem extends SpherItem = SpherItem> = {
  /** Items to place on the sphere. Each item must have a stable `id`. */
  items: TItem[]
  /** Sphere radius in CSS pixels. `"auto"` tracks the canvas's shorter side. */
  radius?: number | "auto"
  /** Perspective distance in CSS pixels. Higher values flatten depth. */
  perspective?: number
  /** Initial or controlled rotation in degrees. */
  rotation?: {
    x: number
    y: number
  }
  /** Static pitch/yaw/roll offset applied before user rotation. */
  tilt?: SpherTilt
  /** Zoom configuration. Groups the current value, bounds, and inside-view threshold. */
  zoom?: SpherZoom
  /** Which side of each card shows the main cover. */
  faceMode?: SpherFaceMode
  /** Strategy used to distribute items when `position` is not provided. */
  placement?: SpherPlacement
  /** Built-in pointer, wheel, keyboard, and auto-rotation controls. */
  controls?: SpherControls
  /** Currently selected item id. Pass `null` to clear selection. */
  selectedId?: string | null
  /** Canvas backing-store scale. Defaults to `globalThis.devicePixelRatio`. */
  devicePixelRatio?: number
  /** Optional explicit spherical coordinates for each item. */
  position?: (item: TItem, index: number, items: TItem[]) => SpherPosition | null | undefined
  /** Card size in CSS pixels. `"auto"` derives from the resolved radius. */
  size?: number | "auto" | SpherAutoSize | ((item: TItem, index: number, items: TItem[]) => number)
  /** Custom renderer called for each visible item. */
  render?: (context: CanvasRenderingContext2D, item: TItem, state: SpherRenderState<TItem>) => void
  /** Called when the user selects an item through built-in controls. */
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
  zoom: SpherResolvedZoom
  placement: SpherPlacement
  selectedId: string | null
  devicePixelRatio: number
  faceMode: SpherFaceMode
  viewMode: SpherViewMode
}

export type SpherProjection<TItem extends SpherItem = SpherItem> = ProjectedItem<TItem> & {
  faceMode: SpherFaceMode
  front: boolean
  coverVisible: boolean
  selected: boolean
  visibleSide: SpherCardSide
  visibility: number
  viewMode: SpherViewMode
}

export type SpherListener<TItem extends SpherItem = SpherItem> = (state: SpherState<TItem>) => void

export type SpherInstance<TItem extends SpherItem = SpherItem> = {
  update: (patch: Partial<SpherOptions<TItem>>) => void
  select: (id: string | null) => void
  rotateTo: (rotation: SpherState<TItem>["rotation"]) => void
  destroy: () => void
  itemState: (id: string) => SpherRenderState<TItem> | null
  getState: () => SpherState<TItem>
  subscribe: (listener: SpherListener<TItem>) => () => void
}
