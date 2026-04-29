import type { ReactNode } from "react";

export type SphericalArchiveViewMode = "inside" | "shell";
export type SphericalArchivePlacement = "fibonacci" | "latitude-longitude-grid";
export type SphericalArchiveFaceDirection = "inward" | "outward";

export type SphericalArchiveItemBase = {
  id: string;
  title: string;
  image: string;
  year: number;
};

export type SphericalArchiveFilter<TItem> = {
  id: string;
  label: string;
  options: string[];
  allLabel?: string;
  getValue: (item: TItem) => string;
  getOptionLabel?: (option: string) => string;
};

export type SphericalArchiveDetailContext<TItem> = {
  items: TItem[];
  matchingItems: TItem[];
  relatedItems: TItem[];
  selected: TItem;
  selectItem: (id: string) => void;
  viewMode: SphericalArchiveViewMode;
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

export type SphericalArchiveProps<TItem extends SphericalArchiveItemBase> = {
  items: TItem[];
  title: string;
  brand?: ReactNode;
  filters?: SphericalArchiveFilter<TItem>[];
  initialSelectedId?: string;
  initialZoom?: number;
  insideZoomThreshold?: number;
  minZoom?: number;
  maxZoom?: number;
  sphereRadius?: number;
  scenePerspective?: number;
  initialPlacement?: SphericalArchivePlacement;
  getItemSize?: (item: TItem) => number;
  getItemAspectClass?: (item: TItem) => string;
  getItemRingClass?: (item: TItem) => string;
  getItemAriaLabel?: (item: TItem) => string;
  getRelatedItems?: (
    selected: TItem,
    matchingItems: TItem[],
    items: TItem[],
  ) => TItem[];
  renderDetail: (
    selected: TItem,
    context: SphericalArchiveDetailContext<TItem>,
  ) => ReactNode;
  renderLegend?: () => ReactNode;
};
