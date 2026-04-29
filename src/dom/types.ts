import type { PositionedItem, ProjectedItem, SpherItemBase, SpherPlacement } from "../core/types.js"

export type SpherDomFaceDirection = "inward" | "outward"

export type SpherDomViewMode = "inside" | "shell"

export type SpherDomPosition = {
  latitude: number
  longitude: number
}

export type SpherDomItem = SpherItemBase

export type SpherDomControls =
  | boolean
  | {
      drag?: boolean
      keyboard?: boolean
      wheel?: boolean
      preventDocumentScroll?: boolean
    }

export type SpherDomOptions<TItem extends SpherDomItem = SpherDomItem> = {
  items: TItem[]
  radius?: number
  perspective?: number
  insideZoomThreshold?: number
  minZoom?: number
  maxZoom?: number
  rotation?: {
    x: number
    y: number
  }
  zoom?: number
  faceDirection?: SpherDomFaceDirection
  placement?: SpherPlacement
  controls?: SpherDomControls
  selectedId?: string | null
  position?: (item: TItem, index: number, items: TItem[]) => SpherDomPosition | null | undefined
  size?: number | ((item: TItem, index: number, items: TItem[]) => number)
  element?: (item: TItem) => HTMLElement | null
  render?: (item: TItem, element: HTMLElement) => void
  onSelect?: (item: TItem) => void
}

export type SpherDomState<TItem extends SpherDomItem = SpherDomItem> = {
  items: TItem[]
  radius: number
  perspective: number
  insideZoomProgress: number
  insideZoomThreshold: number
  insideSceneScale: number
  minZoom: number
  maxZoom: number
  rotation: {
    x: number
    y: number
  }
  sceneZoom: number
  zoom: number
  faceDirection: SpherDomFaceDirection
  placement: SpherPlacement
  selectedId: string | null
  viewMode: SpherDomViewMode
}

export type SpherDomSurfaceProjection<TItem extends SpherDomItem = SpherDomItem> =
  ProjectedItem<TItem> & {
    faceOutExterior: boolean
    front: boolean
    insideScale: number
    surfaceVisible: boolean
    visibility: number
  }

export type SpherDomItemState<TItem extends SpherDomItem = SpherDomItem> = {
  item: PositionedItem<TItem>
  edgeFactor: number
  faceDirection: SpherDomFaceDirection
  front: boolean
  insideScale: number
  interactive: boolean
  normalY: number
  perspectiveScale: number
  visible: boolean
  visibility: number
  selected: boolean
  viewMode: SpherDomViewMode
}

export type SpherDomListener<TItem extends SpherDomItem = SpherDomItem> = (
  state: SpherDomState<TItem>,
) => void

export type SpherDomInstance<TItem extends SpherDomItem = SpherDomItem> = {
  update: (patch: Partial<SpherDomOptions<TItem>>) => void
  select: (id: string | null) => void
  rotateTo: (rotation: SpherDomState<TItem>["rotation"]) => void
  destroy: () => void
  itemState: (id: string) => SpherDomItemState<TItem> | null
  getState: () => SpherDomState<TItem>
  subscribe: (listener: SpherDomListener<TItem>) => () => void
}
