export type SpherPlacement = "fibonacci" | "latitude-longitude-grid"

export type SpherItem = {
  /** Default card cover source. Accepts URLs and drawable canvas sources. */
  cover?: string | CanvasImageSource | null
  /** Stable item id used for selection, updates, and hit testing. */
  id: string
}

export type PositionedItem<TItem = SpherItem> = TItem &
  SpherItem & {
    longitude: number
    latitude: number
    baseX: number
    baseY: number
    baseZ: number
    radius: number
    roll: number
    size: number
  }

export type ProjectedItem<TItem = SpherItem> = {
  item: PositionedItem<TItem>
  projectedX: number
  projectedY: number
  perspectiveScale: number
  edgeFactor: number
  normalY: number
  z: number
}
