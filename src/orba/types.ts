import type { ReactNode } from "react";
import type {
  SphericalArchiveItemBase,
  SphericalArchivePlacement,
  SphericalArchiveViewMode,
} from "../core/types.js";

export type {
  PositionedItem,
  ProjectedItem,
  SphericalArchiveFaceDirection,
  SphericalArchiveItemBase,
  SphericalArchivePlacement,
  SphericalArchiveViewMode,
} from "../core/types.js";

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
