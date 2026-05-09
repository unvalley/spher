import type { PositionedItem, SpherItem, SpherPlacement } from "../core/types.js"

export type { SpherItem } from "../core/types.js"

export type SpherRenderState<TItem = SpherItem> = {
  item: PositionedItem<TItem>
  edgeFactor: number
  coverSide: "outside" | "inside"
  front: boolean
  normalY: number
  perspectiveScale: number
  selected: boolean
  visibleSide: "outside" | "inside"
  visibility: number
  viewMode: "inside" | "outside"
}

export type SpherOptions<TItem = SpherItem> = {
  /** Items to place on the sphere. Each item must have a stable `id`. */
  items: Array<TItem & SpherItem>
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
  tilt?:
    | number
    | {
        /** Pitch offset in degrees, applied before user rotation. */
        x?: number
        /** Yaw offset in degrees, applied before user rotation. */
        y?: number
        /** Roll offset in degrees, useful for visually leaning the sphere. */
        z?: number
      }
  /** Zoom configuration. Groups the current value, bounds, and inside-view threshold. */
  zoom?: {
    /** Current zoom level. Defaults to 1. */
    value?: number
    /** Lower bound for interactive zoom. Defaults to 0.66. */
    min?: number
    /** Upper bound for interactive zoom. Defaults to 4.4. */
    max?: number
    /** Zoom level where rendering switches from outside view to inside view. Defaults to 1.32. */
    insideThreshold?: number
  }
  /** Which side of each card shows the main cover. */
  coverSide?: "outside" | "inside"
  /** Strategy used to distribute items when `position` is not provided. */
  placement?: SpherPlacement
  /** Built-in pointer, wheel, keyboard, and auto-rotation controls. */
  controls?: {
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
  /** Currently selected item id. Pass `null` to clear selection. */
  selectedId?: string | null
  /** Canvas backing-store scale. Defaults to `globalThis.devicePixelRatio`. */
  devicePixelRatio?: number
  /** Optional explicit spherical coordinates for each item. */
  position?: (
    item: TItem & SpherItem,
    index: number,
    items: Array<TItem & SpherItem>,
  ) => { latitude: number; longitude: number } | null | undefined
  /** Card size in CSS pixels. `"auto"` derives from the resolved radius. */
  size?:
    | number
    | "auto"
    | {
        /** Size-to-diameter ratio used for responsive card sizing. Defaults to 0.1. */
        ratio?: number
        /** Minimum resolved card size in CSS pixels. */
        min?: number
        /** Maximum resolved card size in CSS pixels. */
        max?: number
      }
    | ((item: TItem & SpherItem, index: number, items: Array<TItem & SpherItem>) => number)
  /** Custom renderer called for each visible item. */
  render?: (
    context: CanvasRenderingContext2D,
    item: TItem & SpherItem,
    state: SpherRenderState<TItem>,
  ) => void
  /** Called when the user selects an item through built-in controls. */
  onSelect?: (item: TItem & SpherItem) => void
}

export type SpherState<TItem = SpherItem> = {
  items: Array<TItem & SpherItem>
  radius: number
  perspective: number
  rotation: {
    x: number
    y: number
  }
  tilt: {
    x: number
    y: number
    z: number
  }
  zoom: {
    /** Current zoom level before inside-view remapping. */
    value: number
    /** Lower bound for interactive zoom. */
    min: number
    /** Upper bound for interactive zoom. */
    max: number
    /** Zoom level where rendering switches from outside view to inside view. */
    insideThreshold: number
  }
  placement: SpherPlacement
  selectedId: string | null
  devicePixelRatio: number
  coverSide: "outside" | "inside"
  viewMode: "inside" | "outside"
}

export type SpherInstance<TItem = SpherItem> = {
  update: (patch: Partial<SpherOptions<TItem>>) => void
  select: (id: string | null) => void
  rotateTo: (rotation: SpherState<TItem>["rotation"]) => void
  destroy: () => void
  itemState: (id: string) => SpherRenderState<TItem> | null
  getState: () => SpherState<TItem>
  subscribe: (listener: (state: SpherState<TItem>) => void) => () => void
}
