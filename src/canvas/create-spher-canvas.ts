import { findNearestProjectedItem } from "../core/hit-test.js"
import { clamp, toRadians } from "../core/math.js"
import { placeItems } from "../core/placement.js"
import { projectItems } from "../core/projection.js"
import type { PositionedItem } from "../core/types.js"
import { normalizeCanvasControls } from "./controls.js"
import type {
  SpherCardSide,
  SpherFaceMode,
  SpherInstance,
  SpherItem,
  SpherListener,
  SpherOptions,
  SpherProjection,
  SpherRenderState,
  SpherState,
  SpherViewMode,
} from "./types.js"

const defaultRadius = 320
const defaultPerspective = 900
const defaultRotation = { x: 0, y: 0 }
const defaultTilt = { x: 0, y: 0, z: 0 }
const defaultZoom = 1
const defaultInsideZoomThreshold = 1.32
const defaultMinZoom = 0.66
const defaultMaxZoom = 4.4
const defaultFaceMode = "face-out" as const
const defaultPlacement = "fibonacci" as const
const autoRadiusRatio = 0.42
const autoSizeRatio = 0.1
const dragClickThreshold = 6
const dragRotationScale = {
  x: 180 / (Math.PI * 1000),
  y: 180 / (Math.PI * 300),
}
const momentumDecay = 0.95
const maxMomentumVelocity = 8.6
const minMomentumVelocity = 0.01

export const createSpher = <TItem extends SpherItem>(
  canvas: HTMLCanvasElement,
  options: SpherOptions<TItem>,
): SpherInstance<TItem> => {
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Could not create a 2D canvas context.")
  }

  const listeners = new Set<SpherListener<TItem>>()
  const projections = new Map<string, SpherProjection<TItem>>()
  let placedItemsCache: PositionedItem<TItem>[] | null = null
  let placedItemsCacheDeps: {
    items: TItem[]
    placement: SpherState<TItem>["placement"]
    position: SpherOptions<TItem>["position"]
    radius: number
    size: SpherOptions<TItem>["size"]
  } | null = null
  let dragStart: {
    rotation: SpherState<TItem>["rotation"]
    x: number
    y: number
  } | null = null
  let lastPointer: { t: number; x: number; y: number } | null = null
  let dragDistance = 0
  let rotationFrame: number | null = null
  let autoRotationFrame: number | null = null
  let momentumVelocity = { x: 0, y: 0 }
  let targetRotation = { ...defaultRotation }
  let destroyed = false
  let stateOptions: SpherOptions<TItem> = { ...options }
  let viewport = readViewport(canvas)
  let state = normalizeOptions(stateOptions, viewport)
  targetRotation = { ...state.rotation }

  const emit = () => {
    for (const listener of listeners) listener({ ...state })
  }

  const controls = () => normalizeCanvasControls(stateOptions.controls)

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width * state.devicePixelRatio))
    const height = Math.max(1, Math.round(rect.height * state.devicePixelRatio))
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
  }

  const resolvedSize = ():
    | number
    | ((item: TItem, index: number, items: TItem[]) => number)
    | undefined => resolveSizeOption(stateOptions.size, state.radius)

  const getPlacedItems = () => {
    const size = resolvedSize()
    const deps = {
      items: state.items,
      placement: state.placement,
      position: stateOptions.position,
      radius: state.radius,
      size,
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
      size,
      position: stateOptions.position,
    })
    placedItemsCacheDeps = deps
    return placedItemsCache
  }

  const getInteractiveProjections = () =>
    Array.from(projections.values()).filter((projection) => projection.visibility > 0)

  const cancelRotationFrame = () => {
    if (rotationFrame === null) return
    cancelAnimationFrame(rotationFrame)
    rotationFrame = null
  }

  const cancelAutoRotationFrame = () => {
    if (autoRotationFrame === null) return
    cancelAnimationFrame(autoRotationFrame)
    autoRotationFrame = null
  }

  const setRotationState = (rotation: SpherState<TItem>["rotation"]) => {
    state = { ...state, rotation }
    render()
    emit()
  }

  const applyMomentum = () => {
    if (
      Math.abs(momentumVelocity.x) <= minMomentumVelocity &&
      Math.abs(momentumVelocity.y) <= minMomentumVelocity
    ) {
      momentumVelocity = { x: 0, y: 0 }
      rotationFrame = null
      return
    }

    const rotation = {
      x: clamp(state.rotation.x + momentumVelocity.x, -72, 72),
      y: state.rotation.y + momentumVelocity.y,
    }
    targetRotation = rotation
    setRotationState(rotation)
    momentumVelocity = {
      x: momentumVelocity.x * momentumDecay,
      y: momentumVelocity.y * momentumDecay,
    }
    rotationFrame = requestAnimationFrame(applyMomentum)
  }

  const startMomentumRotation = () => {
    cancelRotationFrame()
    if (
      Math.abs(momentumVelocity.x) <= minMomentumVelocity &&
      Math.abs(momentumVelocity.y) <= minMomentumVelocity
    ) {
      momentumVelocity = { x: 0, y: 0 }
      return
    }
    rotationFrame = requestAnimationFrame(applyMomentum)
  }

  const syncAutoRotation = () => {
    const resolvedControls = controls()
    if (!resolvedControls.autoRotate) {
      cancelAutoRotationFrame()
      return
    }
    if (autoRotationFrame !== null) return

    const tick = () => {
      const currentControls = controls()
      if (destroyed || !currentControls.autoRotate) {
        autoRotationFrame = null
        return
      }
      if (!dragStart && rotationFrame === null) {
        const rotation = {
          x: state.rotation.x,
          y: state.rotation.y + currentControls.autoRotateSpeed,
        }
        targetRotation = rotation
        setRotationState(rotation)
      }
      autoRotationFrame = requestAnimationFrame(tick)
    }

    autoRotationFrame = requestAnimationFrame(tick)
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

  const selectItem = (item: TItem) => {
    stateOptions = { ...stateOptions, selectedId: item.id }
    state = { ...state, selectedId: item.id }
    stateOptions.onSelect?.(item)
    render()
    emit()
  }

  const render = () => {
    if (destroyed) return

    resizeCanvas()
    projections.clear()

    const rect = canvas.getBoundingClientRect()
    const width = canvas.width / state.devicePixelRatio
    const height = canvas.height / state.devicePixelRatio
    context.save()
    context.scale(state.devicePixelRatio, state.devicePixelRatio)
    context.clearRect(0, 0, width, height)
    context.translate(width / 2, height / 2)

    const projectedItems = projectItems(getPlacedItems(), {
      rotation: state.rotation,
      tilt: state.tilt,
      zoom: state.sceneZoom,
      perspective: state.perspective,
      perspectiveMode: state.viewMode === "inside" ? "inside" : "outside",
    })
      .map((item, index) => ({ item, index }))
      .sort((a, b) => b.item.z - a.item.z || a.index - b.index)
      .map(({ item }) => item)

    for (const projected of projectedItems) {
      const selected = projected.item.id === state.selectedId
      const front = state.viewMode === "inside" ? projected.z < 0 : projected.z < -30
      const visibleSide = getVisibleSide(projected.z, state.viewMode)
      const coverVisible = isCoverVisible(state.faceMode, visibleSide)
      const visibility = getVisibility({
        edgeFactor: projected.edgeFactor,
        selected,
        state,
        z: projected.z,
      })
      const projection = {
        ...projected,
        faceMode: state.faceMode,
        front,
        coverVisible,
        selected,
        visibleSide,
        visibility,
        viewMode: state.viewMode,
      }
      projections.set(projected.item.id, projection)
      if (visibility <= 0) continue

      context.save()
      context.globalAlpha = visibility
      const planeTransform = getProjectedPlaneTransform(projected.item, state)
      context.transform(
        planeTransform.a,
        planeTransform.b,
        planeTransform.c,
        planeTransform.d,
        planeTransform.e,
        planeTransform.f,
      )

      const renderState = toRenderState(projection)
      if (stateOptions.render) {
        stateOptions.render(context, projected.item, renderState)
      } else {
        renderDefaultItem(context, renderState)
      }
      context.restore()
    }

    context.restore()

    if (rect.width === 0 || rect.height === 0) {
      return
    }
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!controls().drag) return
    cancelRotationFrame()
    dragStart = { x: event.clientX, y: event.clientY, rotation: state.rotation }
    lastPointer = { x: event.clientX, y: event.clientY, t: performance.now() }
    dragDistance = 0
    momentumVelocity = { x: 0, y: 0 }
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic pointer events may not have an active pointer to capture.
    }
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragStart || !controls().drag) return
    const now = performance.now()
    const deltaFromStartX = event.clientX - dragStart.x
    const deltaFromStartY = event.clientY - dragStart.y

    if (lastPointer) {
      const stepX = event.clientX - lastPointer.x
      const stepY = event.clientY - lastPointer.y
      const dt = Math.max(now - lastPointer.t, 1)
      dragDistance += Math.hypot(stepX, stepY)
      momentumVelocity =
        dt >= 8
          ? {
              x: clamp(
                ((-stepY * dragRotationScale.x) / dt) * 16.67,
                -maxMomentumVelocity,
                maxMomentumVelocity,
              ),
              y: clamp(
                ((stepX * dragRotationScale.y) / dt) * 16.67,
                -maxMomentumVelocity,
                maxMomentumVelocity,
              ),
            }
          : { x: 0, y: 0 }
    }
    lastPointer = { x: event.clientX, y: event.clientY, t: now }

    const rotation = {
      x: clamp(dragStart.rotation.x - deltaFromStartY * dragRotationScale.x, -72, 72),
      y: dragStart.rotation.y + deltaFromStartX * dragRotationScale.y,
    }
    targetRotation = rotation
    setRotationState(rotation)
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!controls().drag) return
    const shouldSelect = dragDistance < dragClickThreshold
    dragStart = null
    lastPointer = null
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    if (!shouldSelect) {
      startMomentumRotation()
      return
    }
    momentumVelocity = { x: 0, y: 0 }
    hitSelect(event.clientX, event.clientY)
  }

  const handleWheel = (event: WheelEvent) => {
    if (!controls().wheel) return
    if (controls().preventDocumentScroll) event.preventDefault()
    if (event.ctrlKey || event.metaKey || event.altKey) {
      state = withDerivedState({
        ...state,
        zoom: clamp(state.zoom - event.deltaY * 0.0014, state.minZoom, state.maxZoom),
      })
      render()
      emit()
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
      state = withDerivedState({
        ...state,
        zoom: clamp(
          state.zoom + (event.key === "ArrowUp" ? zoomStep : -zoomStep),
          state.minZoom,
          state.maxZoom,
        ),
      })
      render()
      emit()
      return
    }

    const rotationStep = event.shiftKey ? 5 : 1
    const deltaByKey: Record<string, [number, number]> = {
      ArrowUp: [-rotationStep, 0],
      ArrowDown: [rotationStep, 0],
      ArrowLeft: [0, -rotationStep],
      ArrowRight: [0, rotationStep],
    }
    const delta = deltaByKey[event.key]
    if (!delta) return

    event.preventDefault()
    scheduleRotationDelta(delta[0], delta[1])
  }

  const hitSelect = (clientX: number, clientY: number) => {
    const hit = findNearestProjectedItem(
      clientX,
      clientY,
      getInteractiveProjections(),
      canvas.getBoundingClientRect(),
    )
    if (!hit) return
    const item = state.items.find((candidate) => candidate.id === hit.id)
    if (item) selectItem(item)
  }

  const update = (patch: Partial<SpherOptions<TItem>>) => {
    stateOptions = { ...stateOptions, ...patch }
    state = normalizeOptions(stateOptions, viewport, state)
    if (objectHasOwnProperty.call(patch, "rotation")) targetRotation = { ...state.rotation }
    render()
    emit()
    syncAutoRotation()
  }

  const handleViewportChange = () => {
    const next = readViewport(canvas)
    if (next.width === viewport.width && next.height === viewport.height) return
    viewport = next
    if (stateOptions.radius !== "auto" && stateOptions.size !== "auto") return
    state = normalizeOptions(stateOptions, viewport, state)
    render()
    emit()
  }

  const resizeObserver =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleViewportChange) : null
  resizeObserver?.observe(canvas)

  const select = (id: string | null) => {
    const item = id ? state.items.find((candidate) => candidate.id === id) : null
    stateOptions = { ...stateOptions, selectedId: id }
    state = { ...state, selectedId: id }
    if (item) stateOptions.onSelect?.(item)
    render()
    emit()
  }

  const rotateTo = (rotation: SpherState<TItem>["rotation"]) => {
    cancelRotationFrame()
    targetRotation = { ...rotation }
    update({ rotation })
  }

  const destroy = () => {
    destroyed = true
    cancelRotationFrame()
    cancelAutoRotationFrame()
    resizeObserver?.disconnect()
    canvas.removeEventListener("pointerdown", handlePointerDown)
    canvas.removeEventListener("pointermove", handlePointerMove)
    canvas.removeEventListener("pointerup", handlePointerUp)
    canvas.removeEventListener("pointercancel", handlePointerUp)
    canvas.removeEventListener("wheel", handleWheel)
    window.removeEventListener("keydown", handleKeyDown)
    projections.clear()
    listeners.clear()
  }

  const itemState = (id: string): SpherRenderState<TItem> | null => {
    const projection = projections.get(id)
    return projection ? toRenderState(projection) : null
  }

  canvas.addEventListener("pointerdown", handlePointerDown)
  canvas.addEventListener("pointermove", handlePointerMove)
  canvas.addEventListener("pointerup", handlePointerUp)
  canvas.addEventListener("pointercancel", handlePointerUp)
  canvas.addEventListener("wheel", handleWheel, { passive: false })
  window.addEventListener("keydown", handleKeyDown)
  render()
  syncAutoRotation()

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

type Viewport = { width: number; height: number }

const readViewport = (canvas: HTMLCanvasElement): Viewport => {
  const rect = canvas.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

const resolveRadius = (
  raw: SpherOptions["radius"],
  viewport: Viewport,
  previous: number | undefined,
): number => {
  if (raw === "auto") {
    const minDim = Math.min(viewport.width, viewport.height)
    return minDim > 0 ? minDim * autoRadiusRatio : (previous ?? defaultRadius)
  }
  return raw ?? previous ?? defaultRadius
}

const normalizeOptions = <TItem extends SpherItem>(
  options: SpherOptions<TItem>,
  viewport: Viewport,
  previous?: SpherState<TItem>,
): SpherState<TItem> =>
  withDerivedState({
    items: options.items ?? previous?.items ?? [],
    radius: resolveRadius(options.radius, viewport, previous?.radius),
    perspective: options.perspective ?? previous?.perspective ?? defaultPerspective,
    rotation: options.rotation ?? previous?.rotation ?? defaultRotation,
    tilt: resolveTilt(options.tilt, previous?.tilt),
    zoom: options.zoom ?? previous?.zoom ?? defaultZoom,
    insideZoomThreshold:
      options.insideZoomThreshold ?? previous?.insideZoomThreshold ?? defaultInsideZoomThreshold,
    minZoom: options.minZoom ?? previous?.minZoom ?? defaultMinZoom,
    maxZoom: options.maxZoom ?? previous?.maxZoom ?? defaultMaxZoom,
    faceMode: options.faceMode ?? previous?.faceMode ?? defaultFaceMode,
    placement: options.placement ?? previous?.placement ?? defaultPlacement,
    selectedId: objectHasOwnProperty.call(options, "selectedId")
      ? (options.selectedId ?? null)
      : (previous?.selectedId ?? null),
    devicePixelRatio:
      options.devicePixelRatio ?? previous?.devicePixelRatio ?? globalThis.devicePixelRatio ?? 1,
  })

const withDerivedState = <TItem extends SpherItem>(
  state: Omit<
    SpherState<TItem>,
    "insideZoomProgress" | "insideSceneScale" | "sceneZoom" | "viewMode"
  >,
): SpherState<TItem> => {
  const viewMode = state.zoom >= state.insideZoomThreshold ? "inside" : "shell"
  const insideZoomProgress =
    viewMode === "inside"
      ? clamp(
          (state.zoom - state.insideZoomThreshold) /
            Math.max(0.01, state.maxZoom - state.insideZoomThreshold),
          0,
          1,
        )
      : 0
  const insideSceneScale = 1 + insideZoomProgress * 1.45

  return {
    ...state,
    insideZoomProgress,
    insideSceneScale,
    sceneZoom: viewMode === "inside" ? insideSceneScale : state.zoom,
    viewMode,
  }
}

const objectHasOwnProperty = Object.prototype.hasOwnProperty

const getVisibleSide = (z: number, viewMode: SpherViewMode): SpherCardSide => {
  if (viewMode === "inside") return "inside"
  return z < 0 ? "outside" : "inside"
}

const isCoverVisible = (faceMode: SpherFaceMode, visibleSide: SpherCardSide) =>
  visibleSide === (faceMode === "face-out" ? "outside" : "inside")

const resolveSizeOption = <TItem extends SpherItem>(
  size: SpherOptions<TItem>["size"],
  radius: number,
): number | ((item: TItem, index: number, items: TItem[]) => number) | undefined => {
  const diameter = radius * 2
  if (size === "auto") return diameter * autoSizeRatio
  if (size === undefined) return undefined
  if (typeof size === "number") return size
  if (typeof size === "function") return size

  const ratio = size.ratio ?? autoSizeRatio
  const min = size.min ?? 0
  const max = size.max ?? Number.POSITIVE_INFINITY
  return clamp(diameter * ratio, min, max)
}

const resolveTilt = (tilt: SpherOptions["tilt"], previous: SpherState["tilt"] | undefined) => {
  if (tilt === undefined) return previous ?? defaultTilt
  if (typeof tilt === "number") return { x: tilt, y: 0, z: 0 }
  return {
    x: tilt.x ?? previous?.x ?? 0,
    y: tilt.y ?? previous?.y ?? 0,
    z: tilt.z ?? previous?.z ?? 0,
  }
}

type GetVisibilityOptions<TItem extends SpherItem> = {
  edgeFactor: number
  selected: boolean
  state: SpherState<TItem>
  z: number
}

const getVisibility = <TItem extends SpherItem>({
  edgeFactor,
  selected,
  state,
  z,
}: GetVisibilityOptions<TItem>) => {
  const normalizedDepth = Math.abs(z) / Math.max(1, state.radius * state.sceneZoom)
  const sideVisibility = smoothstep(0.02, 0.18, normalizedDepth)

  if (state.viewMode === "inside") {
    const insideVisibleDepth = -state.radius * state.insideSceneScale * 0.02
    const fadeRange = state.radius * state.insideSceneScale * 0.12
    const depthVisibility =
      1 - smoothstep(insideVisibleDepth - fadeRange, insideVisibleDepth + fadeRange, z)
    if (depthVisibility <= 0) return 0
    return clamp((1 - edgeFactor * 0.16) * depthVisibility * sideVisibility, 0, 1)
  }

  if (selected) return 1
  return sideVisibility
}

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

type Point3D = { x: number; y: number; z: number }

type ProjectedPoint = { x: number; y: number; z: number }

const getProjectedPlaneTransform = <TItem extends SpherItem>(
  item: PositionedItem<TItem>,
  state: SpherState<TItem>,
) => {
  const center = { x: item.baseX, y: item.baseY, z: item.baseZ }
  const { right, down } = getPlaneBasis(item)
  const projectedCenter = projectPoint(center, state)
  const projectedRight = projectPoint(
    {
      x: center.x + right.x,
      y: center.y + right.y,
      z: center.z + right.z,
    },
    state,
  )
  const projectedDown = projectPoint(
    {
      x: center.x + down.x,
      y: center.y + down.y,
      z: center.z + down.z,
    },
    state,
  )

  return {
    a: projectedRight.x - projectedCenter.x,
    b: projectedRight.y - projectedCenter.y,
    c: projectedDown.x - projectedCenter.x,
    d: projectedDown.y - projectedCenter.y,
    e: projectedCenter.x,
    f: projectedCenter.y,
  }
}

const getPlaneBasis = <TItem extends SpherItem>(item: PositionedItem<TItem>) => {
  const longitude = toRadians(item.longitude)
  const latitude = toRadians(item.latitude)
  const right = {
    x: Math.cos(longitude),
    y: 0,
    z: -Math.sin(longitude),
  }
  const down = {
    x: Math.sin(latitude) * Math.sin(longitude),
    y: Math.cos(latitude),
    z: Math.sin(latitude) * Math.cos(longitude),
  }

  if (item.roll === 0) return { right, down }

  const roll = toRadians(item.roll)
  const cosRoll = Math.cos(roll)
  const sinRoll = Math.sin(roll)
  return {
    right: {
      x: right.x * cosRoll + down.x * sinRoll,
      y: right.y * cosRoll + down.y * sinRoll,
      z: right.z * cosRoll + down.z * sinRoll,
    },
    down: {
      x: down.x * cosRoll - right.x * sinRoll,
      y: down.y * cosRoll - right.y * sinRoll,
      z: down.z * cosRoll - right.z * sinRoll,
    },
  }
}

const projectPoint = <TItem extends SpherItem>(
  point: Point3D,
  { perspective, rotation, sceneZoom, tilt, viewMode }: SpherState<TItem>,
): ProjectedPoint => {
  // cobe parity: RotX(theta) · RotY(phi) · p.
  const theta = toRadians(rotation.x + tilt.x)
  const phi = toRadians(rotation.y + tilt.y)
  const roll = toRadians(tilt.z)
  const cx = Math.cos(theta)
  const cy = Math.cos(phi)
  const sx = Math.sin(theta)
  const sy = Math.sin(phi)
  const cz = Math.cos(roll)
  const sz = Math.sin(roll)

  let x = cy * point.x + sy * point.z
  let y = sy * sx * point.x + cx * point.y - cy * sx * point.z
  let z = -sy * cx * point.x + sx * point.y + cy * cx * point.z

  if (roll !== 0) {
    const rolledX = cz * x - sz * y
    y = sz * x + cz * y
    x = rolledX
  }

  x *= sceneZoom
  y *= sceneZoom
  z *= sceneZoom

  const perspectiveScale = perspective / Math.max(1, perspective + (viewMode === "inside" ? -z : z))
  return {
    x: x * perspectiveScale,
    y: y * perspectiveScale,
    z,
  }
}

const toRenderState = <TItem extends SpherItem>({
  edgeFactor,
  faceMode,
  front,
  coverVisible,
  item,
  normalY,
  perspectiveScale,
  selected,
  visibleSide,
  visibility,
  viewMode,
}: SpherProjection<TItem>): SpherRenderState<TItem> => ({
  item,
  edgeFactor,
  faceMode,
  front,
  coverVisible,
  normalY,
  perspectiveScale,
  selected,
  visibleSide,
  visibility,
  viewMode,
})

const renderDefaultItem = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  { coverVisible, item, selected }: SpherRenderState<TItem>,
) => {
  const width = item.size
  const height = item.size * 1.28
  context.fillStyle = selected
    ? "rgba(255, 255, 255, 0.92)"
    : coverVisible
      ? "rgba(255, 255, 255, 0.86)"
      : "rgba(15, 23, 42, 0.64)"
  context.strokeStyle = selected ? "rgba(17, 24, 39, 0.96)" : "rgba(15, 23, 42, 0.18)"
  context.lineWidth = selected ? 2 : 1
  context.beginPath()
  context.rect(-width / 2, -height / 2, width, height)
  context.fill()
  context.stroke()
}
