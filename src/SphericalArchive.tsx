"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArchiveCard } from "./orba/ArchiveCard.js";
import { FilterRow } from "./orba/FilterRow.js";
import { preloadArchiveImages } from "./orba/imagePreload.js";
import { clamp, cssNumber, toRadians } from "./orba/math.js";
import { positionItems } from "./orba/placement.js";
import type {
  PositionedItem,
  ProjectedItem,
  SphericalArchiveFaceDirection,
  SphericalArchiveItemBase,
  SphericalArchivePlacement,
  SphericalArchiveProps,
  SphericalArchiveViewMode,
} from "./orba/types.js";

export type {
  SphericalArchiveDetailContext,
  SphericalArchiveFilter,
  SphericalArchiveFaceDirection,
  SphericalArchiveItemBase,
  SphericalArchivePlacement,
  SphericalArchiveProps,
  SphericalArchiveViewMode,
} from "./orba/types.js";

const defaultSphereRadius = 560;
const defaultScenePerspective = 980;
const defaultInitialZoom = 1.28;
const defaultInsideZoomThreshold = 1.32;
const defaultMinZoom = 0.66;
const defaultMaxZoom = 4.4;

export const SphericalArchive = <TItem extends SphericalArchiveItemBase,>({
  items,
  title,
  brand,
  filters = [],
  initialSelectedId,
  initialZoom = defaultInitialZoom,
  insideZoomThreshold = defaultInsideZoomThreshold,
  minZoom = defaultMinZoom,
  maxZoom = defaultMaxZoom,
  sphereRadius = defaultSphereRadius,
  scenePerspective = defaultScenePerspective,
  initialPlacement = "fibonacci",
  getItemSize,
  getItemAspectClass,
  getItemRingClass,
  getItemAriaLabel,
  getRelatedItems,
  renderDetail,
  renderLegend,
}: SphericalArchiveProps<TItem>) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((filter) => [filter.id, "all"])),
  );
  const [selectedId, setSelectedId] = useState(
    initialSelectedId ?? items[0]?.id ?? "",
  );
  const [rotation, setRotation] = useState({ x: 2, y: -18 });
  const [zoom, setZoom] = useState(initialZoom);
  const [detailOpen, setDetailOpen] = useState(true);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [placement, setPlacement] =
    useState<SphericalArchivePlacement>(initialPlacement);
  const [faceDirection, setFaceDirection] =
    useState<SphericalArchiveFaceDirection>("inward");
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const rotatorRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const dragDistanceRef = useRef(0);
  const targetRotationRef = useRef({ x: 2, y: -18 });
  const displayedRotationRef = useRef({ x: 2, y: -18 });
  const lastRotationCommitRef = useRef(0);
  const rotationFrameRef = useRef<number | null>(null);
  const viewMode: SphericalArchiveViewMode =
    zoom >= insideZoomThreshold ? "inside" : "shell";
  const insideZoomProgress =
    viewMode === "inside"
      ? clamp(
          (zoom - insideZoomThreshold) /
            Math.max(0.01, maxZoom - insideZoomThreshold),
          0,
          1,
        )
      : 0;
  const insideSceneScale = 1 + insideZoomProgress * 1.45;
  const sceneZoom = viewMode === "inside" ? insideSceneScale : zoom;
  const insideVisibleDepth = -sphereRadius * insideSceneScale * 0.02;
  const shellBackReveal =
    viewMode === "shell" ? clamp((1.08 - zoom) / 0.42, 0, 1) : 1;
  const faceOutExteriorDepth = sphereRadius * sceneZoom * 0.14;

  const applySceneRotation = useCallback((nextRotation: typeof rotation) => {
    if (!rotatorRef.current) return;
    rotatorRef.current.style.transform = `rotateX(${cssNumber(
      nextRotation.x,
    )}deg) rotateY(${cssNumber(nextRotation.y)}deg)`;
  }, []);

  const scheduleRotationDelta = useCallback(
    (deltaX: number, deltaY: number) => {
      targetRotationRef.current = {
        x: clamp(targetRotationRef.current.x + deltaX, -72, 72),
        y: targetRotationRef.current.y + deltaY,
      };
      if (rotationFrameRef.current) return;

      const tick = () => {
        const current = displayedRotationRef.current;
        const target = targetRotationRef.current;
        const dx = target.x - current.x;
        const dy = target.y - current.y;

        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
          displayedRotationRef.current = target;
          applySceneRotation(target);
          setRotation(target);
          rotationFrameRef.current = null;
          return;
        }

        const next = {
          x: current.x + dx * 0.24,
          y: current.y + dy * 0.24,
        };
        displayedRotationRef.current = next;
        applySceneRotation(next);

        const now = performance.now();
        if (now - lastRotationCommitRef.current > 90) {
          lastRotationCommitRef.current = now;
          setRotation(next);
        }

        rotationFrameRef.current = requestAnimationFrame(tick);
      };

      rotationFrameRef.current = requestAnimationFrame(tick);
    },
    [applySceneRotation],
  );
  const itemImageSources = useMemo(
    () => Array.from(new Set(items.map(({ image }) => image))),
    [items],
  );

  useEffect(() => {
    setFilterValues((current) => {
      const next = { ...current };
      for (const filter of filters) {
        next[filter.id] ??= "all";
      }
      return next;
    });
  }, [filters]);

  useEffect(() => {
    setPlacement(initialPlacement);
  }, [initialPlacement]);

  useEffect(() => {
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverscrollBehavior =
      document.documentElement.style.overscrollBehavior;
    const bodyOverscrollBehavior = document.body.style.overscrollBehavior;
    const htmlTouchAction = document.documentElement.style.touchAction;
    const bodyTouchAction = document.body.style.touchAction;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.touchAction = "none";
    document.body.style.touchAction = "none";

    const preventBrowserNavigation = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey || event.altKey) {
        setZoom((current) =>
          clamp(current - event.deltaY * 0.0014, minZoom, maxZoom),
        );
        return;
      }

      scheduleRotationDelta(-event.deltaY * 0.024, event.deltaX * 0.024);
    };

    window.addEventListener("wheel", preventBrowserNavigation, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener("wheel", preventBrowserNavigation, {
        capture: true,
      });
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overscrollBehavior = htmlOverscrollBehavior;
      document.body.style.overscrollBehavior = bodyOverscrollBehavior;
      document.documentElement.style.touchAction = htmlTouchAction;
      document.body.style.touchAction = bodyTouchAction;
      if (rotationFrameRef.current) {
        cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
    };
  }, [maxZoom, minZoom, scheduleRotationDelta]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChromeHidden(false);
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("button, input, select, textarea, [contenteditable=true]")
      ) {
        return;
      }

      if (
        event.metaKey &&
        (event.key === "ArrowUp" || event.key === "ArrowDown")
      ) {
        event.preventDefault();
        const zoomStep = event.shiftKey ? 0.18 : 0.1;
        setZoom((current) =>
          clamp(
            current + (event.key === "ArrowUp" ? zoomStep : -zoomStep),
            minZoom,
            maxZoom,
          ),
        );
        return;
      }

      const rotationStep = event.shiftKey ? 5 : 1;
      const keyRotationDelta: Record<string, [number, number]> = {
        ArrowUp: [-rotationStep, 0],
        ArrowDown: [rotationStep, 0],
        ArrowLeft: [0, -rotationStep],
        ArrowRight: [0, rotationStep],
      };
      const delta = keyRotationDelta[event.key];
      if (!delta) return;

      event.preventDefault();
      scheduleRotationDelta(delta[0], delta[1]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maxZoom, minZoom, scheduleRotationDelta]);

  const positionedItems = useMemo(
    () => positionItems(items, sphereRadius, placement, getItemSize),
    [getItemSize, items, placement, sphereRadius],
  );

  const filterActive = filters.some(
    (filter) => (filterValues[filter.id] ?? "all") !== "all",
  );

  const matchesFilters = useCallback(
    (item: TItem) =>
      filters.every((filter) => {
        const value = filterValues[filter.id] ?? "all";
        return value === "all" || filter.getValue(item) === value;
      }),
    [filterValues, filters],
  );

  const matchingItems = useMemo(
    () => positionedItems.filter((item) => matchesFilters(item)),
    [matchesFilters, positionedItems],
  );

  const projectedItems = useMemo(
    () =>
      projectItems(positionedItems, rotation, sceneZoom, scenePerspective),
    [positionedItems, rotation, scenePerspective, sceneZoom],
  );
  const matchingItemIds = useMemo(
    () => new Set(matchingItems.map((item) => item.id)),
    [matchingItems],
  );
  const visibleInsideItemIds = useMemo(
    () =>
      viewMode === "inside"
        ? selectInsideVisibleItemIds(
            projectedItems,
            insideZoomProgress,
            insideSceneScale,
            sphereRadius,
            filterActive,
            matchingItemIds,
          )
        : null,
    [
      filterActive,
      insideSceneScale,
      insideZoomProgress,
      matchingItemIds,
      projectedItems,
      sphereRadius,
      viewMode,
    ],
  );
  const getLiveClickableProjectedItems = useCallback(() => {
    const liveProjectedItems = projectItems(
      positionedItems,
      displayedRotationRef.current,
      sceneZoom,
      scenePerspective,
    );

    if (viewMode !== "inside") {
      return liveProjectedItems.filter(({ z }) =>
        faceDirection === "outward" ? z > faceOutExteriorDepth : z < -30,
      );
    }

    const liveVisibleIds = selectInsideVisibleItemIds(
      liveProjectedItems,
      insideZoomProgress,
      insideSceneScale,
      sphereRadius,
      filterActive,
      matchingItemIds,
    );

    return liveProjectedItems.filter(({ item }) => liveVisibleIds.has(item.id));
  }, [
    filterActive,
    faceDirection,
    faceOutExteriorDepth,
    insideSceneScale,
    insideZoomProgress,
    matchingItemIds,
    positionedItems,
    scenePerspective,
    sceneZoom,
    sphereRadius,
    viewMode,
  ]);
  const renderedProjectedItems = projectedItems;
  useEffect(
    () => preloadArchiveImages(itemImageSources, itemImageSources.length),
    [itemImageSources],
  );

  const selected = useMemo(
    () =>
      positionedItems.find((item) => item.id === selectedId) ??
      positionedItems[0],
    [positionedItems, selectedId],
  );

  const relatedItems = useMemo(() => {
    if (!selected) return [];
    if (getRelatedItems) {
      return getRelatedItems(selected, matchingItems, positionedItems);
    }
    return (matchingItems.length > 0 ? matchingItems : positionedItems)
      .filter((item) => item.id !== selected.id)
      .slice(0, 6);
  }, [getRelatedItems, matchingItems, positionedItems, selected]);

  const selectItem = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    dragDistanceRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragDistanceRef.current += Math.hypot(dx, dy);
    dragRef.current = { x: event.clientX, y: event.clientY };

    scheduleRotationDelta(-dy * 0.08, dx * 0.08);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragDistanceRef.current < 6) {
      const hitItem = findNearestProjectedItem(
        event.clientX,
        event.clientY,
        getLiveClickableProjectedItems(),
        sceneRef.current,
      );
      if (hitItem) selectItem(hitItem.id);
    }

    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleGlobalPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragDistanceRef.current >= 6) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-spherical-archive-ui]")) return;
    const cardTarget = target.closest("[data-spherical-archive-card]");
    if (cardTarget instanceof HTMLElement) {
      const cardId = cardTarget.dataset.sphericalArchiveId;
      if (cardId) selectItem(cardId);
      return;
    }

    const hitItem = findNearestProjectedItem(
      event.clientX,
      event.clientY,
      getLiveClickableProjectedItems(),
      sceneRef.current,
    );
    if (hitItem) selectItem(hitItem.id);
  };

  const setFilterValue = (filterId: string, value: string) => {
    setFilterValues((current) => ({ ...current, [filterId]: value }));
  };

  const resetView = () => {
    targetRotationRef.current = { x: 2, y: -18 };
    displayedRotationRef.current = targetRotationRef.current;
    applySceneRotation(targetRotationRef.current);
    setRotation(targetRotationRef.current);
    setZoom(initialZoom);
  };

  if (!selected) return null;

  return (
    <main
      className={`fixed inset-0 h-screen w-screen overflow-hidden overscroll-none bg-white text-gray-950 ${
        chromeHidden ? "cursor-none" : ""
      }`}
      onPointerUpCapture={handleGlobalPointerUp}
    >
      {brand && !chromeHidden ? (
        <div
          data-spherical-archive-ui
          className="pointer-events-none fixed left-4 top-4 z-50 flex items-center gap-3 rounded-md border border-gray-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur"
        >
          {brand}
        </div>
      ) : null}

      <section className="fixed inset-0 overflow-hidden bg-white">
        {!chromeHidden ? (
          <>
            <div
              data-spherical-archive-ui
              className="pointer-events-none absolute left-8 top-20 z-30 max-w-xl"
            >
              <h1 className="text-4xl font-normal tracking-normal text-gray-950">
                {title}
              </h1>

              {filters.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {filters.map((filter) => (
                    <FilterRow
                      key={filter.id}
                      filter={filter}
                      value={filterValues[filter.id] ?? "all"}
                      onChange={(value) => setFilterValue(filter.id, value)}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div
              data-spherical-archive-ui
              className="absolute right-8 top-8 z-30 flex items-center gap-2"
            >
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white/90 px-2 py-1.5 shadow-sm backdrop-blur">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((current) => clamp(current - 0.18, minZoom, maxZoom))
                  }
                  className="grid h-7 w-7 place-items-center rounded border border-gray-200 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-950"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <input
                  type="range"
                  min={minZoom}
                  max={maxZoom}
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.currentTarget.value))}
                  className="h-7 w-24 accent-gray-950"
                  aria-label="Zoom"
                />
                <button
                  type="button"
                  onClick={() =>
                    setZoom((current) => clamp(current + 0.18, minZoom, maxZoom))
                  }
                  className="grid h-7 w-7 place-items-center rounded border border-gray-200 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-950"
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPlacement((current) =>
                    current === "fibonacci"
                      ? "latitude-longitude-grid"
                      : "fibonacci",
                  )
                }
                className={`rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] shadow-sm backdrop-blur transition-colors ${
                  placement === "latitude-longitude-grid"
                    ? "border-gray-950 bg-gray-950 text-white hover:bg-gray-800"
                    : "border-gray-200 bg-white/90 text-gray-500 hover:border-gray-400 hover:text-gray-950"
                }`}
                aria-pressed={placement === "latitude-longitude-grid"}
              >
                {placement === "fibonacci" ? "Fibonacci" : "Grid"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFaceDirection((current) =>
                    current === "inward" ? "outward" : "inward",
                  )
                }
                className={`rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] shadow-sm backdrop-blur transition-colors ${
                  faceDirection === "outward"
                    ? "border-gray-950 bg-gray-950 text-white hover:bg-gray-800"
                    : "border-gray-200 bg-white/90 text-gray-500 hover:border-gray-400 hover:text-gray-950"
                }`}
                aria-pressed={faceDirection === "outward"}
              >
                Face {faceDirection === "outward" ? "Out" : "In"}
              </button>
              <button
                type="button"
                onClick={resetView}
                className="rounded-md border border-gray-200 bg-white/90 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-500 shadow-sm backdrop-blur transition-colors hover:border-gray-400 hover:text-gray-950"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setChromeHidden(true)}
                className="rounded-md border border-gray-200 bg-white/90 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-500 shadow-sm backdrop-blur transition-colors hover:border-gray-400 hover:text-gray-950"
              >
                Hide UI
              </button>
            </div>
          </>
        ) : null}

        <div
          className="absolute inset-0 cursor-grab touch-none overflow-hidden overscroll-none active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            ref={sceneRef}
            className="absolute inset-0"
            style={{ perspective: `${cssNumber(scenePerspective)}px` }}
          >
            {viewMode === "inside" ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[154vmax] w-[154vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
                style={
                  {
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0 42%, rgba(148,163,184,0.045) 64%, rgba(15,23,42,0.105) 100%)",
                    boxShadow: "inset 0 0 170px rgba(15,23,42,0.085)",
                  } as CSSProperties
                }
              />
            ) : null}
            <div
              className="absolute inset-0 origin-center"
              style={
                {
                  transform: `scale(${cssNumber(sceneZoom)})`,
                  transformStyle: "preserve-3d",
                } as CSSProperties
              }
            >
              <div
                ref={rotatorRef}
                className="absolute left-1/2 top-1/2 h-0 w-0"
                style={
                  {
                    transform: `rotateX(${cssNumber(rotation.x)}deg) rotateY(${cssNumber(rotation.y)}deg)`,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                  } as CSSProperties
                }
              >
                {renderedProjectedItems.map(
                      ({
                        item,
                        z,
                        perspectiveScale,
                        edgeFactor,
                        normalY,
                      }) => {
                        const matched = matchingItemIds.has(item.id);
                        const inFront =
                          viewMode === "inside"
                            ? Boolean(visibleInsideItemIds?.has(item.id))
                            : z < -30;
                        const faceOutExterior =
                          viewMode === "shell" && z > faceOutExteriorDepth;
                        const depthOpacity =
                          viewMode === "inside"
                            ? clamp(1 - edgeFactor * 0.28, 0.62, 1)
                            : clamp((-z + 260) / 620, 0.34, 1);
                        const filterOpacity =
                          !filterActive || matched ? 1 : 0.28;
                        const insideVisible =
                          viewMode !== "inside" || z < insideVisibleDepth;
                        const visibleOpacity =
                          viewMode === "inside" && !insideVisible
                            ? 0
                            : viewMode === "inside" && !inFront
                              ? 0.72
                              : viewMode === "shell" && !inFront
                                ? shellBackReveal * 0.52
                                : 1;
                        const baseCardOpacity =
                          depthOpacity * filterOpacity * visibleOpacity;
                        const faceOutInteriorOpacity =
                          faceDirection === "outward" &&
                          (viewMode === "inside" || !faceOutExterior)
                            ? 0.32
                            : 1;
                        const faceDirectedOpacity =
                          faceDirection === "outward"
                            ? (filterActive && !matched ? 0.32 : 1) *
                              faceOutInteriorOpacity
                            : baseCardOpacity;
                        const interactive =
                          viewMode === "shell" && faceDirection === "outward"
                            ? faceOutExterior
                            : inFront;
                        const insideScale = clamp(
                          (1.02 + insideZoomProgress * 0.08) *
                            (1 - edgeFactor * 0.08),
                          0.84,
                          1.12,
                        );

                        return (
                          <ArchiveCard
                            key={item.id}
                            item={item}
                            selected={item.id === selected.id}
                            viewMode={viewMode}
                            filterActive={filterActive}
                            matched={matched}
                            depthOpacity={clamp(faceDirectedOpacity, 0, 1)}
                            interactive={interactive}
                            perspectiveScale={perspectiveScale}
                            insideScale={insideScale}
                            edgeFactor={edgeFactor}
                            normalY={normalY}
                            faceDirection={faceDirection}
                            getItemAspectClass={getItemAspectClass}
                            getItemRingClass={getItemRingClass}
                            getItemAriaLabel={getItemAriaLabel}
                            onSelect={() => selectItem(item.id)}
                          />
                        );
                      },
                    )}
              </div>
            </div>
          </div>
        </div>

        {detailOpen && !chromeHidden ? (
          <aside
            data-spherical-archive-ui
            className="absolute bottom-7 right-7 z-40 w-[min(360px,calc(100vw-3rem))] rounded-xl border border-gray-200 bg-white/86 p-4 pr-8 shadow-sm backdrop-blur"
          >
            <button
              type="button"
              aria-label="Close details"
              onClick={() => setDetailOpen(false)}
              className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded border border-gray-200 bg-white/70 font-mono text-[11px] text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-950"
            >
              x
            </button>
            {renderDetail(selected, {
              items: positionedItems,
              matchingItems,
              relatedItems,
              selected,
              selectItem,
              viewMode,
            })}
          </aside>
        ) : null}

        {renderLegend && !chromeHidden ? (
          <div
            data-spherical-archive-ui
            className="absolute bottom-7 left-8 z-40 hidden gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400 md:flex"
          >
            {renderLegend()}
          </div>
        ) : null}
      </section>
    </main>
  );
};

const projectItems = <TItem extends SphericalArchiveItemBase,>(
  items: PositionedItem<TItem>[],
  rotation: { x: number; y: number },
  zoom: number,
  scenePerspective: number,
): ProjectedItem<TItem>[] => {
  return items.map((item) => {
    const rotationX = toRadians(rotation.x);
    const rotationY = toRadians(rotation.y);
    let x = item.baseX;
    let y = item.baseY;
    let z = item.baseZ;

    const xAfterY = x * Math.cos(rotationY) + z * Math.sin(rotationY);
    const zAfterY = -x * Math.sin(rotationY) + z * Math.cos(rotationY);
    x = xAfterY;
    z = zAfterY;

    const yAfterX = y * Math.cos(rotationX) - z * Math.sin(rotationX);
    const zAfterX = y * Math.sin(rotationX) + z * Math.cos(rotationX);
    y = yAfterX;
    z = zAfterX;

    const normalY = clamp(y / item.radius, -1, 1);

    x *= zoom;
    y *= zoom;
    z *= zoom;

    const perspectiveScale = scenePerspective / (scenePerspective - z);
    const angularDistance = Math.atan2(Math.hypot(x, y), Math.max(1, -z));
    const edgeFactor = clamp(angularDistance / (Math.PI / 2), 0, 1);

    return {
      item,
      projectedX: x * perspectiveScale,
      projectedY: y * perspectiveScale,
      perspectiveScale,
      edgeFactor,
      normalY,
      z,
    };
  });
};

const selectInsideVisibleItemIds = <TItem extends SphericalArchiveItemBase,>(
  projectedItems: ProjectedItem<TItem>[],
  insideZoomProgress: number,
  insideSceneScale: number,
  sphereRadius: number,
  filterActive: boolean,
  matchingItemIds: Set<string>,
) => {
  const visibleDepth = -sphereRadius * insideSceneScale * 0.02;
  const selected: ProjectedItem<TItem>[] = [];
  const selectedIds = new Set<string>();
  const candidates = projectedItems
    .filter(({ z }) => z < visibleDepth)
    .sort((a, b) => {
      if (filterActive) {
        const matchDelta =
          Number(matchingItemIds.has(b.item.id)) -
          Number(matchingItemIds.has(a.item.id));
        if (matchDelta !== 0) return matchDelta;
      }
      return a.edgeFactor - b.edgeFactor;
    });

  for (const candidate of candidates) {
    const candidateRadius = getInsideCollisionRadius(
      candidate,
      insideZoomProgress,
      insideSceneScale,
    );
    const overlaps = selected.some((existing) => {
      const minimumDistance =
        candidateRadius +
        getInsideCollisionRadius(
          existing,
          insideZoomProgress,
          insideSceneScale,
        );
      return (
        Math.hypot(
          candidate.projectedX - existing.projectedX,
          candidate.projectedY - existing.projectedY,
        ) < minimumDistance
      );
    });

    if (!overlaps) {
      selected.push(candidate);
      selectedIds.add(candidate.item.id);
    }
  }

  return selectedIds;
};

const getInsideCollisionRadius = <TItem extends SphericalArchiveItemBase,>(
  projectedItem: ProjectedItem<TItem>,
  insideZoomProgress: number,
  insideSceneScale: number,
) => {
  const insideScale = clamp(
    (1.02 + insideZoomProgress * 0.08) *
      (1 - projectedItem.edgeFactor * 0.08),
    0.84,
    1.12,
  );
  return Math.max(
    36,
    projectedItem.item.size * insideScale * insideSceneScale * 0.48,
  );
};

const findNearestProjectedItem = <TItem extends SphericalArchiveItemBase,>(
  clientX: number,
  clientY: number,
  projectedItems: ProjectedItem<TItem>[],
  sceneElement: HTMLDivElement | null,
) => {
  if (!sceneElement) return null;

  const rect = sceneElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let nearest: { item: PositionedItem<TItem>; distance: number } | null = null;

  for (const {
    item,
    projectedX,
    projectedY,
    perspectiveScale,
  } of projectedItems) {
    const screenX = centerX + projectedX;
    const screenY = centerY + projectedY;
    const distance = Math.hypot(screenX - clientX, screenY - clientY);
    const hitRadius = Math.max(40, item.size * perspectiveScale * 0.82);

    if (distance <= hitRadius && (!nearest || distance < nearest.distance)) {
      nearest = { item, distance };
    }
  }

  return nearest?.item ?? null;
};
