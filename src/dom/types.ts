import type { ProjectedItem, SpherItemBase, SpherPlacement } from "../core/index.js"

export type SpherDomPosition = {
  latitude: number
  longitude: number
}

export type SpherDomItem = SpherItemBase

export type SpherDomControls =
  | boolean
  | {
      drag?: boolean
      wheel?: boolean
      preventDocumentScroll?: boolean
    }

export type SpherDomOptions<TItem extends SpherDomItem = SpherDomItem> = {
  items: TItem[]
  radius?: number
  perspective?: number
  rotation?: {
    x: number
    y: number
  }
  zoom?: number
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
  rotation: {
    x: number
    y: number
  }
  zoom: number
  placement: SpherPlacement
  selectedId: string | null
}

export type SpherDomProjection<TItem extends SpherDomItem = SpherDomItem> = ProjectedItem<TItem> & {
  front: boolean
  visibility: number
}

export type SpherDomListener<TItem extends SpherDomItem = SpherDomItem> = (
  state: SpherDomState<TItem>,
) => void

export type SpherDomInstance<TItem extends SpherDomItem = SpherDomItem> = {
  update: (patch: Partial<SpherDomOptions<TItem>>) => void
  select: (id: string | null) => void
  rotateTo: (rotation: SpherDomState<TItem>["rotation"]) => void
  destroy: () => void
  project: (id: string) => SpherDomProjection<TItem> | null
  getState: () => SpherDomState<TItem>
  subscribe: (listener: SpherDomListener<TItem>) => () => void
}
