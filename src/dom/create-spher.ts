import { findNearestProjectedItem } from "../core/hit-test.js"
import { clamp, cssNumber } from "../core/math.js"
import { placeItems } from "../core/placement.js"
import { projectItems, selectVisibleSurfaceItemIds } from "../core/projection.js"
import type { PositionedItem } from "../core/types.js"
import { normalizeControls } from "./controls.js"
import type {
  SpherDomChangeReason,
  SpherDomInstance,
  SpherDomItem,
  SpherDomItemState,
  SpherDomListener,
  SpherDomOptions,
  SpherDomState,
  SpherDomSurfaceProjection,
} from "./types.js"

const defaultRadius = 320
const defaultPerspective = 900
const defaultRotation = { x: 0, y: 0 }
const defaultZoom = 1
const defaultInsideZoomThreshold = 1.32
const defaultMinZoom = 0.66
const defaultMaxZoom = 4.4
const defaultPlacement = "fibonacci" as const
const dragClickThreshold = 6

export const createSpher = <TItem extends SpherDomItem>(
  root: HTMLElement,
  options: SpherDomOptions<TItem>,
): SpherDomInstance<TItem> => {
  const listeners = new Set<SpherDomListener<TItem>>()
  const elements = new Map<string, HTMLElement>()
  const createdElements = new Set<HTMLElement>()
  const originalElementPositions = new Map<
    HTMLElement,
    {
      parent: Node
      nextSibling: ChildNode | null
    }
  >()
  const projections = new Map<string, SpherDomSurfaceProjection<TItem>>()
  const previousRootPosition = root.style.position
  const previousRootPerspective = root.style.perspective
  const previousRootOverflow = root.style.overflow
  const internalOptions = options as SpherDomOptions<TItem> & { layer?: HTMLElement | null }
  const layer = internalOptions.layer ?? document.createElement("div")
  const ownsLayer = !internalOptions.layer
  const previousLayerStyle = layer.getAttribute("style")
  const previousLayerDatasetValue = layer.dataset.spherLayer
  let placedItemsCache: PositionedItem<TItem>[] | null = null
  let placedItemsCacheDeps: {
    items: TItem[]
    placement: SpherDomState<TItem>["placement"]
    position: SpherDomOptions<TItem>["position"]
    radius: number
    size: SpherDomOptions<TItem>["size"]
  } | null = null
  let reconcileDeps: {
    element: SpherDomOptions<TItem>["element"]
    items: TItem[]
    render: SpherDomOptions<TItem>["render"]
  } | null = null
  let dragStart: { x: number; y: number } | null = null
  let dragDistance = 0
  let suppressNextClick = false
  let rotationFrame: number | null = null
  let targetRotation = { ...defaultRotation }
  let destroyed = false
  let stateOptions: SpherDomOptions<TItem> = { ...options }
  let state = normalizeOptions(options)
  targetRotation = { ...state.rotation }
  const rootStyle = getComputedStyle(root)

  root.dataset.spherRoot = ""
  if (!root.style.position && rootStyle.position === "static") root.style.position = "relative"
  if (!root.style.overflow && rootStyle.overflow === "visible") root.style.overflow = "hidden"
  root.style.perspective = `${cssNumber(state.perspective)}px`

  layer.dataset.spherLayer = ""
  Object.assign(layer.style, {
    position: "absolute",
    inset: "0",
    transformOrigin: "50% 50%",
    transformStyle: "preserve-3d",
    willChange: "transform",
  })
  if (ownsLayer) root.append(layer)

  const emit = (reason: SpherDomChangeReason) => {
    for (const listener of listeners) listener({ ...state }, { reason })
  }

  const controls = () => normalizeControls(stateOptions.controls)

  const isInteractive = (projection: SpherDomSurfaceProjection<TItem>) =>
    state.viewMode === "shell" && state.faceDirection === "outward"
      ? projection.faceOutExterior
      : projection.front && (projection.surfaceVisible || projection.item.id === state.selectedId)

  const cancelRotationFrame = () => {
    if (rotationFrame === null) return
    cancelAnimationFrame(rotationFrame)
    rotationFrame = null
  }

  const setRotationState = (rotation: SpherDomState<TItem>["rotation"]) => {
    state = { ...state, rotation }
    render()
    emit("rotation")
  }

  const scheduleRotationDelta = (deltaX: number, deltaY: number) => {
    targetRotation = {
      x: clamp(targetRotation.x + deltaX, -72, 72),
      y: targetRotation.y + deltaY,
    }
    if (rotationFrame !== null) return

    const tick = () => {
      const dx = targetRotation.x - state.rotation.x
      const dy = targetRotation.y - state.rotation.y

      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        setRotationState({ ...targetRotation })
        rotationFrame = null
        return
      }

      setRotationState({
        x: state.rotation.x + dx * 0.24,
        y: state.rotation.y + dy * 0.24,
      })
      rotationFrame = requestAnimationFrame(tick)
    }

    rotationFrame = requestAnimationFrame(tick)
  }

  const restoreElement = (element: HTMLElement) => {
    const originalPosition = originalElementPositions.get(element)
    if (!originalPosition) return

    if (originalPosition.nextSibling?.parentNode === originalPosition.parent) {
      originalPosition.parent.insertBefore(element, originalPosition.nextSibling)
    } else {
      originalPosition.parent.appendChild(element)
    }
    originalElementPositions.delete(element)
  }

  const selectItem = (item: TItem) => {
    stateOptions = { ...stateOptions, selectedId: item.id }
    state = { ...state, selectedId: item.id }
    stateOptions.onSelect?.(item)
    render()
    emit("select")
  }

  const getPlacedItems = () => {
    const deps = {
      items: state.items,
      placement: state.placement,
      position: stateOptions.position,
      radius: state.radius,
      size: stateOptions.size,
    }
    if (
      placedItemsCache &&
      placedItemsCacheDeps &&
      placedItemsCacheDeps.items === deps.items &&
      placedItemsCacheDeps.placement === deps.placement &&
      placedItemsCacheDeps.position === deps.position &&
      placedItemsCacheDeps.radius === deps.radius &&
      placedItemsCacheDeps.size === deps.size
    ) {
      return placedItemsCache
    }

    placedItemsCache = placeItems(state.items, {
      radius: state.radius,
      placement: state.placement,
      size: stateOptions.size,
      position: stateOptions.position,
    })
    placedItemsCacheDeps = deps
    return placedItemsCache
  }

  const reconcileElements = () => {
    const deps = {
      element: stateOptions.element,
      items: state.items,
      render: stateOptions.render,
    }
    if (
      reconcileDeps &&
      reconcileDeps.element === deps.element &&
      reconcileDeps.items === deps.items &&
      reconcileDeps.render === deps.render
    ) {
      return
    }

    const nextIds = new Set(state.items.map((item) => item.id))

    for (const [id, element] of elements) {
      if (nextIds.has(id)) continue
      element.removeEventListener("click", handleItemClick)
      if (createdElements.has(element)) {
        element.remove()
      } else {
        restoreElement(element)
      }
      elements.delete(id)
      createdElements.delete(element)
    }

    for (const item of state.items) {
      let element = stateOptions.element?.(item) ?? elements.get(item.id)
      if (!element) {
        element = document.createElement("div")
        createdElements.add(element)
        layer.append(element)
      } else if (element.parentElement !== layer) {
        if (element.parentNode && !originalElementPositions.has(element)) {
          originalElementPositions.set(element, {
            parent: element.parentNode,
            nextSibling: element.nextSibling,
          })
        }
        layer.append(element)
      }

      element.dataset.spherItem = item.id
      element.removeEventListener("click", handleItemClick)
      element.addEventListener("click", handleItemClick)
      Object.assign(element.style, {
        position: "absolute",
        left: "50%",
        top: "50%",
        backfaceVisibility: "visible",
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
      })
      stateOptions.render?.(item, element)
      elements.set(item.id, element)
    }
    reconcileDeps = deps
  }

  function handleItemClick(event: MouseEvent) {
    if (suppressNextClick) {
      event.stopPropagation()
      event.preventDefault()
      suppressNextClick = false
      return
    }

    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) return
    const item = state.items.find(({ id }) => id === target.dataset.spherItem)
    const projection = item ? projections.get(item.id) : null
    if (!item || !projection || !isInteractive(projection)) return

    event.stopPropagation()
    selectItem(item)
  }

  const render = () => {
    if (destroyed) return

    root.style.perspective = `${cssNumber(state.perspective)}px`
    layer.style.transform = `scale(${cssNumber(state.sceneZoom)}) rotateX(${cssNumber(
      state.rotation.x,
    )}deg) rotateY(${cssNumber(state.rotation.y)}deg)`
    reconcileElements()
    projections.clear()

    const placedItems = getPlacedItems()
    const projectedItems = projectItems(placedItems, {
      rotation: state.rotation,
      zoom: state.sceneZoom,
      perspective: state.perspective,
    })
    const selectedItemIds = state.selectedId ? new Set([state.selectedId]) : undefined
    const visibleSurfaceItemIds =
      state.viewMode === "inside"
        ? selectVisibleSurfaceItemIds({
            projectedItems,
            radius: state.radius,
            zoom: state.sceneZoom,
            sceneScale: state.insideSceneScale,
            prioritizeIds: selectedItemIds,
          })
        : null

    for (const projected of projectedItems) {
      const shellFront = projected.z < -30
      const faceOutExterior =
        state.viewMode === "shell" && projected.z > state.radius * state.sceneZoom * 0.14
      const front = state.viewMode === "inside" ? projected.z < 0 : shellFront
      const surfaceVisible =
        state.viewMode === "inside"
          ? Boolean(visibleSurfaceItemIds?.has(projected.item.id))
          : state.faceDirection === "outward"
            ? faceOutExterior
            : shellFront
      const selected = projected.item.id === state.selectedId
      const insideScale = getInsideScale(projected.edgeFactor, state.insideZoomProgress)
      const visibility = getVisibility({
        edgeFactor: projected.edgeFactor,
        faceDirection: state.faceDirection,
        faceOutExterior,
        front,
        insideSceneScale: state.insideSceneScale,
        radius: state.radius,
        selected,
        surfaceVisible,
        viewMode: state.viewMode,
        z: projected.z,
        zoom: state.zoom,
      })
      const projection = {
        ...projected,
        faceOutExterior,
        front,
        insideScale,
        surfaceVisible,
        visibility,
      }
      projections.set(projected.item.id, projection)

      const element = elements.get(projected.item.id)
      if (!element) continue

      element.style.setProperty("--spher-visibility", cssNumber(visibility))
      element.style.setProperty("--spher-longitude", `${cssNumber(projected.item.longitude)}deg`)
      element.style.setProperty("--spher-latitude", `${cssNumber(projected.item.latitude)}deg`)
      element.style.setProperty("--spher-radius", `${cssNumber(projected.item.radius)}px`)
      element.style.setProperty("--spher-roll", `${cssNumber(projected.item.roll)}deg`)
      element.style.setProperty("--spher-edge", cssNumber(projected.edgeFactor))
      element.style.setProperty("--spher-inside-scale", cssNumber(insideScale))
      element.style.setProperty("--spher-normal-y", cssNumber(projected.normalY))
      element.style.setProperty("--spher-perspective-scale", cssNumber(projected.perspectiveScale))
      element.style.setProperty("--spher-selected", selected ? "1" : "0")
      element.dataset.spherFaceDirection = state.faceDirection
      element.dataset.spherFaceOutExterior = faceOutExterior ? "true" : "false"
      element.dataset.spherVisible = visibility > 0 ? "true" : "false"
      element.dataset.spherFront = front ? "true" : "false"
      element.dataset.spherInteractive = isInteractive(projection) ? "true" : "false"
      element.dataset.spherSelected = selected ? "true" : "false"
      element.dataset.spherViewMode = state.viewMode
      element.style.transform = `translate(-50%, -50%) rotateY(${cssNumber(
        projected.item.longitude,
      )}deg) rotateX(${cssNumber(projected.item.latitude)}deg) translateZ(-${cssNumber(
        projected.item.radius,
      )}px) rotateZ(${cssNumber(projected.item.roll)}deg) scale(${cssNumber(
        state.viewMode === "inside" ? insideScale : 1,
      )})`
      element.style.opacity = cssNumber(visibility)
      element.style.pointerEvents = isInteractive(projection) ? "auto" : "none"
    }
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!controls().drag) return
    dragStart = { x: event.clientX, y: event.clientY }
    dragDistance = 0
    suppressNextClick = false
    try {
      root.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic pointer events may not have an active pointer to capture.
    }
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragStart || !controls().drag) return
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y
    dragDistance += Math.hypot(dx, dy)
    dragStart = { x: event.clientX, y: event.clientY }
    scheduleRotationDelta(-dy * 0.08, dx * 0.08)
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!controls().drag) return
    suppressNextClick = dragDistance >= dragClickThreshold
    dragStart = null
    if (root.hasPointerCapture(event.pointerId)) {
      root.releasePointerCapture(event.pointerId)
    }
  }

  const handleWheel = (event: WheelEvent) => {
    if (!controls().wheel) return
    if (controls().preventDocumentScroll) event.preventDefault()
    if (event.ctrlKey || event.metaKey || event.altKey) {
      state = {
        ...state,
        zoom: clamp(state.zoom - event.deltaY * 0.0014, state.minZoom, state.maxZoom),
      }
      state = normalizeOptions(stateOptions, state)
      render()
      emit("zoom")
    } else {
      scheduleRotationDelta(-event.deltaY * 0.024, event.deltaX * 0.024)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!controls().keyboard) return
    const target = event.target
    if (
      target instanceof HTMLElement &&
      target.closest("button, input, select, textarea, [contenteditable=true]")
    ) {
      return
    }

    if (event.metaKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault()
      const zoomStep = event.shiftKey ? 0.18 : 0.1
      state = {
        ...state,
        zoom: clamp(
          state.zoom + (event.key === "ArrowUp" ? zoomStep : -zoomStep),
          state.minZoom,
          state.maxZoom,
        ),
      }
      state = normalizeOptions(stateOptions, state)
      render()
      emit("zoom")
      return
    }

    const rotationStep = event.shiftKey ? 5 : 1
    const keyRotationDelta: Record<string, [number, number]> = {
      ArrowUp: [-rotationStep, 0],
      ArrowDown: [rotationStep, 0],
      ArrowLeft: [0, -rotationStep],
      ArrowRight: [0, rotationStep],
    }
    const delta = keyRotationDelta[event.key]
    if (!delta) return

    event.preventDefault()
    scheduleRotationDelta(delta[0], delta[1])
  }

  const handleClick = (event: MouseEvent) => {
    if (suppressNextClick) {
      suppressNextClick = false
      return
    }

    const rect = root.getBoundingClientRect()
    const hit = findNearestProjectedItem(
      event.clientX,
      event.clientY,
      Array.from(projections.values()).filter(isInteractive),
      rect,
    )
    if (hit) {
      const item = state.items.find(({ id }) => id === hit.id)
      if (item) selectItem(item)
    }
  }

  const update = (patch: Partial<SpherDomOptions<TItem>>) => {
    stateOptions = { ...stateOptions, ...patch }
    state = normalizeOptions(stateOptions, state)
    if (hasOption(patch, "rotation")) targetRotation = { ...state.rotation }
    render()
    emit("update")
  }

  const select = (id: string | null) => {
    const item = id ? state.items.find((candidate) => candidate.id === id) : null
    stateOptions = { ...stateOptions, selectedId: id }
    state = { ...state, selectedId: id }
    if (item) stateOptions.onSelect?.(item)
    render()
    emit("select")
  }

  const rotateTo = (rotation: SpherDomState<TItem>["rotation"]) => {
    cancelRotationFrame()
    targetRotation = { ...rotation }
    update({ rotation })
  }

  const destroy = () => {
    destroyed = true
    cancelRotationFrame()
    root.removeEventListener("pointerdown", handlePointerDown)
    root.removeEventListener("pointermove", handlePointerMove)
    root.removeEventListener("pointerup", handlePointerUp)
    root.removeEventListener("pointercancel", handlePointerUp)
    root.removeEventListener("wheel", handleWheel)
    root.removeEventListener("click", handleClick)
    window.removeEventListener("keydown", handleKeyDown)
    for (const element of elements.values()) {
      element.removeEventListener("click", handleItemClick)
      if (!createdElements.has(element)) restoreElement(element)
    }
    if (ownsLayer) {
      layer.remove()
    } else if (previousLayerStyle === null) {
      layer.removeAttribute("style")
    } else {
      layer.setAttribute("style", previousLayerStyle)
    }
    if (previousLayerDatasetValue === undefined) {
      delete layer.dataset.spherLayer
    } else {
      layer.dataset.spherLayer = previousLayerDatasetValue
    }
    root.style.position = previousRootPosition
    root.style.perspective = previousRootPerspective
    root.style.overflow = previousRootOverflow
    delete root.dataset.spherRoot
    elements.clear()
    createdElements.clear()
    originalElementPositions.clear()
    projections.clear()
    listeners.clear()
  }

  const itemState = (id: string): SpherDomItemState<TItem> | null => {
    const projection = projections.get(id)
    if (!projection) return null

    return {
      item: projection.item,
      edgeFactor: projection.edgeFactor,
      faceDirection: state.faceDirection,
      front: projection.front,
      insideScale: projection.insideScale,
      interactive: isInteractive(projection),
      normalY: projection.normalY,
      perspectiveScale: projection.perspectiveScale,
      visible: projection.surfaceVisible,
      visibility: projection.visibility,
      selected: projection.item.id === state.selectedId,
      viewMode: state.viewMode,
    }
  }

  root.addEventListener("pointerdown", handlePointerDown)
  root.addEventListener("pointermove", handlePointerMove)
  root.addEventListener("pointerup", handlePointerUp)
  root.addEventListener("pointercancel", handlePointerUp)
  root.addEventListener("wheel", handleWheel, { passive: false })
  root.addEventListener("click", handleClick)
  window.addEventListener("keydown", handleKeyDown)
  render()

  return {
    update,
    select,
    rotateTo,
    destroy,
    itemState,
    getState: () => ({ ...state }),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const normalizeOptions = <TItem extends SpherDomItem>(
  options: SpherDomOptions<TItem>,
  previous?: SpherDomState<TItem>,
): SpherDomState<TItem> => {
  const selectedId = hasOption(options, "selectedId")
    ? (options.selectedId ?? null)
    : (previous?.selectedId ?? null)
  const zoom = options.zoom ?? previous?.zoom ?? defaultZoom
  const insideZoomThreshold =
    options.insideZoomThreshold ?? previous?.insideZoomThreshold ?? defaultInsideZoomThreshold
  const maxZoom = options.maxZoom ?? previous?.maxZoom ?? defaultMaxZoom
  const viewMode = zoom >= insideZoomThreshold ? "inside" : "shell"
  const insideZoomProgress =
    viewMode === "inside"
      ? clamp((zoom - insideZoomThreshold) / Math.max(0.01, maxZoom - insideZoomThreshold), 0, 1)
      : 0
  const insideSceneScale = 1 + insideZoomProgress * 1.45
  const sceneZoom = viewMode === "inside" ? insideSceneScale : zoom

  return {
    items: options.items ?? previous?.items ?? [],
    radius: options.radius ?? previous?.radius ?? defaultRadius,
    perspective: options.perspective ?? previous?.perspective ?? defaultPerspective,
    insideZoomProgress,
    insideZoomThreshold,
    insideSceneScale,
    minZoom: options.minZoom ?? previous?.minZoom ?? defaultMinZoom,
    maxZoom,
    rotation: options.rotation ?? previous?.rotation ?? defaultRotation,
    sceneZoom,
    zoom,
    faceDirection: options.faceDirection ?? previous?.faceDirection ?? "inward",
    placement: options.placement ?? previous?.placement ?? defaultPlacement,
    selectedId,
    viewMode,
  }
}

const hasOption = <TItem extends SpherDomItem, TKey extends keyof SpherDomOptions<TItem>>(
  options: Partial<SpherDomOptions<TItem>>,
  key: TKey,
) => objectHasOwnProperty.call(options, key)

const objectHasOwnProperty = Object.prototype.hasOwnProperty

type GetVisibilityOptions = {
  edgeFactor: number
  faceDirection: SpherDomState["faceDirection"]
  faceOutExterior: boolean
  front: boolean
  insideSceneScale: number
  radius: number
  selected: boolean
  surfaceVisible: boolean
  viewMode: SpherDomState["viewMode"]
  z: number
  zoom: number
}

const getVisibility = ({
  edgeFactor,
  faceDirection,
  faceOutExterior,
  front,
  insideSceneScale,
  radius,
  selected,
  surfaceVisible,
  viewMode,
  z,
  zoom,
}: GetVisibilityOptions) => {
  if (faceDirection === "outward") {
    if (viewMode === "inside" || !faceOutExterior) return 0.32
    return 1
  }

  const depthOpacity =
    viewMode === "inside" ? clamp(1 - edgeFactor * 0.28, 0.62, 1) : clamp((-z + 260) / 620, 0.34, 1)
  if (viewMode === "inside") {
    const insideVisibleDepth = -radius * insideSceneScale * 0.02
    if (z >= insideVisibleDepth) return 0
    if (selected || surfaceVisible) return depthOpacity
    if (front) return depthOpacity * 0.72
    return 0
  }

  if (selected || surfaceVisible) return depthOpacity

  const shellBackReveal = clamp((1.08 - zoom) / 0.42, 0, 1)
  return depthOpacity * shellBackReveal * 0.52
}

const getInsideScale = (edgeFactor: number, insideZoomProgress: number) =>
  clamp((1.02 + insideZoomProgress * 0.08) * (1 - edgeFactor * 0.08), 0.84, 1.12)
