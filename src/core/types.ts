export type SphericalArchiveViewMode = "inside" | "shell";
export type SphericalArchivePlacement = "fibonacci" | "latitude-longitude-grid";
export type SphericalArchiveFaceDirection = "inward" | "outward";

export type SphericalArchiveItemBase = {
  id: string;
  title: string;
  image: string;
  year: number;
};

export type PositionedItem<TItem extends SphericalArchiveItemBase> = TItem & {
  longitude: number;
  latitude: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  radius: number;
  roll: number;
  size: number;
};

export type ProjectedItem<TItem extends SphericalArchiveItemBase> = {
  item: PositionedItem<TItem>;
  projectedX: number;
  projectedY: number;
  perspectiveScale: number;
  edgeFactor: number;
  normalY: number;
  z: number;
};
