export type OrbaViewMode = "inside" | "shell";
export type OrbaPlacement = "fibonacci" | "latitude-longitude-grid";
export type OrbaFaceDirection = "inward" | "outward";

export type OrbaItemBase = {
  id: string;
};

export type OrbaArchiveItemBase = OrbaItemBase & {
  title: string;
  image: string;
  year: number;
};

export type PositionedItem<TItem extends OrbaItemBase> = TItem & {
  longitude: number;
  latitude: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  radius: number;
  roll: number;
  size: number;
};

export type ProjectedItem<TItem extends OrbaItemBase> = {
  item: PositionedItem<TItem>;
  projectedX: number;
  projectedY: number;
  perspectiveScale: number;
  edgeFactor: number;
  normalY: number;
  z: number;
};
