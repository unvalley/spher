import type {
  OrbaItemBase,
  ProjectedItem,
  SphericalArchivePlacement,
} from "../core/index.js";

export type OrbaDomPosition = {
  latitude: number;
  longitude: number;
};

export type OrbaDomItem = OrbaItemBase & {
  position?: OrbaDomPosition;
  latitude?: number;
  longitude?: number;
  size?: number;
};

export type OrbaDomControls =
  | boolean
  | {
      drag?: boolean;
      wheel?: boolean;
      keyboard?: boolean;
      preventDocumentScroll?: boolean;
    };

export type OrbaDomOptions<TItem extends OrbaDomItem = OrbaDomItem> = {
  items: TItem[];
  radius?: number;
  perspective?: number;
  rotation?: {
    x: number;
    y: number;
  };
  zoom?: number;
  placement?: SphericalArchivePlacement;
  controls?: OrbaDomControls;
  selectedId?: string | null;
  getElement?: (item: TItem) => HTMLElement | null;
  renderItem?: (item: TItem, element: HTMLElement) => void;
  onSelect?: (item: TItem) => void;
};

export type OrbaDomState<TItem extends OrbaDomItem = OrbaDomItem> = {
  items: TItem[];
  radius: number;
  perspective: number;
  rotation: {
    x: number;
    y: number;
  };
  zoom: number;
  placement: SphericalArchivePlacement;
  selectedId: string | null;
};

export type OrbaDomProjection<TItem extends OrbaDomItem = OrbaDomItem> =
  ProjectedItem<TItem> & {
    front: boolean;
    visibility: number;
  };

export type OrbaDomListener<TItem extends OrbaDomItem = OrbaDomItem> = (
  state: OrbaDomState<TItem>,
) => void;

export type OrbaDomInstance<TItem extends OrbaDomItem = OrbaDomItem> = {
  update: (patch: Partial<OrbaDomOptions<TItem>>) => void;
  destroy: () => void;
  project: (id: string) => OrbaDomProjection<TItem> | null;
  getState: () => OrbaDomState<TItem>;
  subscribe: (listener: OrbaDomListener<TItem>) => () => void;
};
