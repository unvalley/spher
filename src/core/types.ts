export type SpherPlacement = "fibonacci" | "latitude-longitude-grid"

export type SpherItemBase = {
  id: string
}

export type PositionedItem<TItem extends SpherItemBase> = TItem & {
  longitude: number
  latitude: number
  baseX: number
  baseY: number
  baseZ: number
  radius: number
  roll: number
  size: number
}

export type ProjectedItem<TItem extends SpherItemBase> = {
  item: PositionedItem<TItem>
  projectedX: number
  projectedY: number
  perspectiveScale: number
  edgeFactor: number
  normalY: number
  z: number
}
