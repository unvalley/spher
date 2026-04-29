import type { CSSProperties } from "react";
import { clamp, cssNumber } from "./math.js";
import type {
  PositionedItem,
  SphericalArchiveFaceDirection,
  SphericalArchiveItemBase,
  SphericalArchiveViewMode,
} from "./types.js";

type ArchiveCardProps<TItem extends SphericalArchiveItemBase> = {
  item: PositionedItem<TItem>;
  selected: boolean;
  viewMode: SphericalArchiveViewMode;
  filterActive: boolean;
  matched: boolean;
  depthOpacity: number;
  interactive: boolean;
  perspectiveScale: number;
  insideScale: number;
  edgeFactor: number;
  normalY: number;
  faceDirection: SphericalArchiveFaceDirection;
  getItemAspectClass?: (item: TItem) => string;
  getItemRingClass?: (item: TItem) => string;
  getItemAriaLabel?: (item: TItem) => string;
  onSelect: () => void;
};

export const ArchiveCard = <TItem extends SphericalArchiveItemBase,>({
  item,
  selected,
  viewMode,
  filterActive,
  matched,
  depthOpacity,
  interactive,
  perspectiveScale,
  insideScale,
  edgeFactor,
  normalY,
  faceDirection,
  getItemAspectClass,
  getItemRingClass,
  getItemAriaLabel,
  onSelect,
}: ArchiveCardProps<TItem>) => {
  const imageSrc = item.image;
  const opacity =
    faceDirection === "outward"
      ? depthOpacity
      : selected || viewMode === "inside"
        ? depthOpacity
        : depthOpacity * 0.9;
  const scale = selected ? 1.22 : 1;
  const sphereFaceTransform = `rotateY(${cssNumber(item.longitude)}deg) rotateX(${cssNumber(item.latitude)}deg) translateZ(-${cssNumber(item.radius)}px) rotateZ(${cssNumber(item.roll)}deg)`;
  const surfaceTransform =
    faceDirection === "outward" ? "rotateY(180deg)" : undefined;
  const transform =
    viewMode === "inside"
      ? `translate(-50%, -50%) ${sphereFaceTransform} scale(${cssNumber(
          scale * insideScale,
        )})`
      : `translate(-50%, -50%) ${sphereFaceTransform} scale(${cssNumber(scale)})`;
  const imageParallaxX = 0;
  const imageParallaxY =
    viewMode === "inside" ? clamp(normalY * 1.4, -2, 2) : 0;
  const imageScale = viewMode === "inside" ? 1.05 + edgeFactor * 0.04 : 1;
  const imageTransform =
    viewMode === "inside"
      ? `translate3d(${cssNumber(imageParallaxX)}px, ${cssNumber(
          imageParallaxY,
        )}px, 0) scale(${cssNumber(imageScale)})`
      : undefined;
  const imageFilter =
    faceDirection === "outward"
      ? "saturate(1.32) contrast(1.34) brightness(0.86)"
      : undefined;
  const imageLightOpacity =
    viewMode === "inside" && faceDirection !== "outward"
      ? clamp(edgeFactor * 0.24, 0, 0.24)
      : 0;
  const ringClass = selected
    ? "z-20 ring-2 ring-gray-950 shadow-2xl"
    : filterActive && matched
      ? `z-10 ring-2 ${getItemRingClass?.(item) ?? "ring-gray-400"} shadow-[0_18px_38px_rgba(15,23,42,0.24)]`
      : "z-10 ring-1 ring-gray-200/80 hover:ring-gray-400 hover:shadow-md";

  return (
    <button
      type="button"
      data-spherical-archive-card
      data-spherical-archive-id={item.id}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => {
        event.stopPropagation();
        if (!interactive) return;
        onSelect();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (!interactive) return;
        onSelect();
      }}
      tabIndex={interactive ? 0 : -1}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-1 shadow-sm transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 ${ringClass}`}
      style={
        {
          width: `${cssNumber(item.size)}px`,
          left: "0px",
          top: "0px",
          zIndex: String(selected ? 40 : Math.round(32 - edgeFactor * 18)),
          transform,
          opacity: cssNumber(opacity),
          pointerEvents: interactive ? "auto" : "none",
          filter:
            filterActive && matched
              ? `saturate(1.12) contrast(1.04) drop-shadow(0 ${Math.round(
                  10 * perspectiveScale,
                )}px ${Math.round(12 * perspectiveScale)}px rgba(15,23,42,0.22))`
              : undefined,
          backfaceVisibility: "visible",
          transformStyle: "preserve-3d",
        } as CSSProperties
      }
      aria-label={getItemAriaLabel?.(item) ?? item.title}
      aria-disabled={!interactive}
    >
      <div
        className={`relative overflow-hidden rounded-sm ${
          getItemAspectClass?.(item) ?? "aspect-[4/5]"
        }`}
        style={
          {
            transform: surfaceTransform,
            backfaceVisibility: "visible",
            transformStyle: "preserve-3d",
          } as CSSProperties
        }
      >
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority={interactive || selected ? "high" : "auto"}
          style={
            {
              transform: imageTransform,
              transformOrigin: `${cssNumber(50 + imageParallaxX * 2)}% ${cssNumber(
                50 + imageParallaxY * 2,
              )}%`,
              backfaceVisibility: "visible",
              filter: imageFilter,
            } as CSSProperties
          }
        />
        {viewMode === "inside" ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={
              {
                opacity: cssNumber(imageLightOpacity),
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0.72), rgba(255,255,255,0) 46%, rgba(15,23,42,0.12))",
              } as CSSProperties
            }
          />
        ) : null}
      </div>
    </button>
  );
};
