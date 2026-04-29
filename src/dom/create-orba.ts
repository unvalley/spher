import {
  findNearestProjectedItem,
  placeItems,
  projectItems,
} from "../core/index.js";
import { clamp, cssNumber } from "../core/math.js";
import { normalizeControls } from "./controls.js";
import type {
  OrbaDomInstance,
  OrbaDomItem,
  OrbaDomListener,
  OrbaDomOptions,
  OrbaDomProjection,
  OrbaDomState,
} from "./types.js";

const defaultRadius = 320;
const defaultPerspective = 900;
const defaultRotation = { x: 0, y: 0 };
const defaultZoom = 1;
const defaultPlacement = "fibonacci" as const;

export const createOrba = <TItem extends OrbaDomItem>(
  root: HTMLElement,
  options: OrbaDomOptions<TItem>,
): OrbaDomInstance<TItem> => {
  const listeners = new Set<OrbaDomListener<TItem>>();
  const elements = new Map<string, HTMLElement>();
  const createdElements = new Set<HTMLElement>();
  const projections = new Map<string, OrbaDomProjection<TItem>>();
  const previousRootPosition = root.style.position;
  const previousRootPerspective = root.style.perspective;
  const previousRootOverflow = root.style.overflow;
  const layer = document.createElement("div");
  let dragStart: { x: number; y: number } | null = null;
  let destroyed = false;
  let stateOptions: OrbaDomOptions<TItem> = { ...options };
  let state = normalizeOptions(options);

  root.dataset.orbaRoot = "";
  if (!root.style.position) root.style.position = "relative";
  if (!root.style.overflow) root.style.overflow = "hidden";
  root.style.perspective = `${cssNumber(state.perspective)}px`;

  layer.dataset.orbaLayer = "";
  Object.assign(layer.style, {
    position: "absolute",
    inset: "0",
    transformStyle: "preserve-3d",
  });
  root.append(layer);

  const emit = () => {
    for (const listener of listeners) listener({ ...state });
  };

  const controls = () => normalizeControls(stateOptions.controls);

  const selectItem = (item: TItem) => {
    state = { ...state, selectedId: item.id };
    stateOptions.onSelect?.(item);
    render();
    emit();
  };

  const reconcileElements = () => {
    const nextIds = new Set(state.items.map((item) => item.id));

    for (const [id, element] of elements) {
      if (nextIds.has(id)) continue;
      element.removeEventListener("click", handleItemClick);
      if (createdElements.has(element)) element.remove();
      elements.delete(id);
      createdElements.delete(element);
    }

    for (const item of state.items) {
      let element = stateOptions.getElement?.(item) ?? elements.get(item.id);
      if (!element) {
        element = document.createElement("div");
        createdElements.add(element);
        layer.append(element);
      } else if (!element.parentElement) {
        layer.append(element);
      }

      element.dataset.orbaItem = item.id;
      element.removeEventListener("click", handleItemClick);
      element.addEventListener("click", handleItemClick);
      Object.assign(element.style, {
        position: "absolute",
        left: "50%",
        top: "50%",
        willChange: "transform, opacity",
      });
      stateOptions.renderItem?.(item, element);
      elements.set(item.id, element);
    }
  };

  function handleItemClick(event: MouseEvent) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const item = state.items.find(({ id }) => id === target.dataset.orbaItem);
    const projection = item ? projections.get(item.id) : null;
    if (!item || projection?.front === false) return;

    event.stopPropagation();
    selectItem(item);
  }

  const render = () => {
    if (destroyed) return;

    root.style.perspective = `${cssNumber(state.perspective)}px`;
    reconcileElements();
    projections.clear();

    const placedItems = placeItems(
      state.items,
      state.radius,
      state.placement,
      (item, index) => stateOptions.getItemSize?.(item, index, state.items) ?? 64,
      (item, index) =>
        stateOptions.getItemPosition?.(item, index, state.items) ?? null,
    );
    const projectedItems = projectItems(
      placedItems,
      state.rotation,
      state.zoom,
      state.perspective,
    );

    for (const projected of projectedItems) {
      const front = projected.z < 0;
      const visibility = front ? clamp(1 - projected.edgeFactor * 0.35, 0, 1) : 0;
      const projection = { ...projected, front, visibility };
      projections.set(projected.item.id, projection);

      const element = elements.get(projected.item.id);
      if (!element) continue;

      element.style.setProperty(
        "--orba-x",
        `${cssNumber(projected.projectedX)}px`,
      );
      element.style.setProperty(
        "--orba-y",
        `${cssNumber(projected.projectedY)}px`,
      );
      element.style.setProperty("--orba-z", cssNumber(projected.z));
      element.style.setProperty(
        "--orba-scale",
        cssNumber(projected.perspectiveScale),
      );
      element.style.setProperty("--orba-edge", cssNumber(projected.edgeFactor));
      element.style.setProperty("--orba-visibility", cssNumber(visibility));
      element.style.setProperty(
        "--orba-selected",
        projected.item.id === state.selectedId ? "1" : "0",
      );
      element.dataset.orbaVisible = front ? "true" : "false";
      element.dataset.orbaFront = front ? "true" : "false";
      element.dataset.orbaSelected =
        projected.item.id === state.selectedId ? "true" : "false";
      element.style.transform = `translate(-50%, -50%) translate3d(${cssNumber(
        projected.projectedX,
      )}px, ${cssNumber(projected.projectedY)}px, 0) scale(${cssNumber(
        projected.perspectiveScale,
      )})`;
      element.style.opacity = cssNumber(visibility);
      element.style.pointerEvents = front ? "auto" : "none";
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!controls().drag) return;
    dragStart = { x: event.clientX, y: event.clientY };
    root.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragStart || !controls().drag) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    dragStart = { x: event.clientX, y: event.clientY };
    state = {
      ...state,
      rotation: {
        x: clamp(state.rotation.x - dy * 0.1, -90, 90),
        y: state.rotation.y + dx * 0.1,
      },
    };
    render();
    emit();
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!controls().drag) return;
    dragStart = null;
    if (root.hasPointerCapture(event.pointerId)) {
      root.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent) => {
    if (!controls().wheel) return;
    if (controls().preventDocumentScroll) event.preventDefault();
    if (event.ctrlKey || event.metaKey || event.altKey) {
      state = {
        ...state,
        zoom: clamp(state.zoom - event.deltaY * 0.0014, 0.1, 8),
      };
    } else {
      state = {
        ...state,
        rotation: {
          x: clamp(state.rotation.x - event.deltaY * 0.024, -90, 90),
          y: state.rotation.y + event.deltaX * 0.024,
        },
      };
    }
    render();
    emit();
  };

  const handleClick = (event: MouseEvent) => {
    const rect = root.getBoundingClientRect();
    const hit = findNearestProjectedItem(
      event.clientX,
      event.clientY,
      Array.from(projections.values()),
      rect,
    );
    if (hit) {
      const item = state.items.find(({ id }) => id === hit.id);
      if (item) selectItem(item);
    }
  };

  const update = (patch: Partial<OrbaDomOptions<TItem>>) => {
    stateOptions = { ...stateOptions, ...patch };
    state = {
      ...state,
      ...normalizeOptions(stateOptions),
    };
    render();
    emit();
  };

  const destroy = () => {
    destroyed = true;
    root.removeEventListener("pointerdown", handlePointerDown);
    root.removeEventListener("pointermove", handlePointerMove);
    root.removeEventListener("pointerup", handlePointerUp);
    root.removeEventListener("pointercancel", handlePointerUp);
    root.removeEventListener("wheel", handleWheel);
    root.removeEventListener("click", handleClick);
    for (const element of elements.values()) {
      element.removeEventListener("click", handleItemClick);
    }
    layer.remove();
    root.style.position = previousRootPosition;
    root.style.perspective = previousRootPerspective;
    root.style.overflow = previousRootOverflow;
    delete root.dataset.orbaRoot;
    elements.clear();
    createdElements.clear();
    projections.clear();
    listeners.clear();
  };

  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", handlePointerUp);
  root.addEventListener("pointercancel", handlePointerUp);
  root.addEventListener("wheel", handleWheel, { passive: false });
  root.addEventListener("click", handleClick);
  render();

  return {
    update,
    destroy,
    project: (id) => projections.get(id) ?? null,
    getState: () => ({ ...state }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const normalizeOptions = <TItem extends OrbaDomItem>(
  options: OrbaDomOptions<TItem>,
): OrbaDomState<TItem> => ({
  items: options.items,
  radius: options.radius ?? defaultRadius,
  perspective: options.perspective ?? defaultPerspective,
  rotation: options.rotation ?? defaultRotation,
  zoom: options.zoom ?? defaultZoom,
  placement: options.placement ?? defaultPlacement,
  selectedId: options.selectedId ?? null,
});
