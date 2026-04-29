import { findNearestProjectedItem } from "../core/hit-test.js"
import { clamp, cssNumber } from "../core/math.js"
import { placeItems } from "../core/placement.js"
import { projectItems } from "../core/projection.js"
import { normalizeControls } from "./controls.js"
import type {
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
const defaultPlacement = "fibonacci" as const

export const createSpher = <TItem extends SpherDomItem>(
  root: HTMLElement,
  options: SpherDomOptions<TItem>,
): SpherDomInstance<TItem> => {
  const listeners = new Set<SpherDomListener<TItem>>()
  const elements = new Map<string, HTMLElement>()
  const createdElements = new Set<HTMLElement>()
  const projections = new Map<string, SpherDomSurfaceProjection<TItem>>()
  const previousRootPosition = root.style.position
  const previousRootPerspective = root.style.perspective
  const previousRootOverflow = root.style.overflow
  const layer = document.createElement("div")
  let dragStart: { x: number; y: number } | null = null
  let destroyed = false
  let stateOptions: SpherDomOptions<TItem> = { ...options }
  let state = normalizeOptions(options)
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
  root.append(layer)

  const emit = () => {
    for (const listener of listeners) listener({ ...state })
  }

  const controls = () => normalizeControls(stateOptions.controls)

  const selectItem = (item: TItem) => {
    stateOptions = { ...stateOptions, selectedId: item.id }
    state = { ...state, selectedId: item.id }
    stateOptions.onSelect?.(item)
    render()
    emit()
  }

  const reconcileElements = () => {
    const nextIds = new Set(state.items.map((item) => item.id))

    for (const [id, element] of elements) {
      if (nextIds.has(id)) continue
      element.removeEventListener("click", handleItemClick)
      if (createdElements.has(element)) element.remove()
      elements.delete(id)
      createdElements.delete(element)
    }

    for (const item of state.items) {
      let element = stateOptions.element?.(item) ?? elements.get(item.id)
      if (!element) {
        element = document.createElement("div")
        createdElements.add(element)
        layer.append(element)
      } else if (!element.parentElement) {
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
  }

  function handleItemClick(event: MouseEvent) {
    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) return
    const item = state.items.find(({ id }) => id === target.dataset.spherItem)
    const projection = item ? projections.get(item.id) : null
    if (!item || projection?.front === false) return

    event.stopPropagation()
    selectItem(item)
  }

  const render = () => {
    if (destroyed) return

    root.style.perspective = `${cssNumber(state.perspective)}px`
    layer.style.transform = `scale(${cssNumber(state.zoom)}) rotateX(${cssNumber(
      state.rotation.x,
    )}deg) rotateY(${cssNumber(state.rotation.y)}deg)`
    reconcileElements()
    projections.clear()

    const placedItems = placeItems(state.items, {
      radius: state.radius,
      placement: state.placement,
      size: stateOptions.size,
      position: stateOptions.position,
    })
    const projectedItems = projectItems(placedItems, {
      rotation: state.rotation,
      zoom: state.zoom,
      perspective: state.perspective,
    })

    for (const projected of projectedItems) {
      const front = projected.z < 0
      const visibility = front ? clamp(1 - projected.edgeFactor * 0.24, 0.62, 1) : 0.34
      const projection = { ...projected, front, visibility }
      projections.set(projected.item.id, projection)

      const element = elements.get(projected.item.id)
      if (!element) continue

      element.style.setProperty("--spher-visibility", cssNumber(visibility))
      element.style.setProperty("--spher-longitude", `${cssNumber(projected.item.longitude)}deg`)
      element.style.setProperty("--spher-latitude", `${cssNumber(projected.item.latitude)}deg`)
      element.style.setProperty("--spher-radius", `${cssNumber(projected.item.radius)}px`)
      element.style.setProperty("--spher-roll", `${cssNumber(projected.item.roll)}deg`)
      element.style.setProperty(
        "--spher-selected",
        projected.item.id === state.selectedId ? "1" : "0",
      )
      element.dataset.spherVisible = visibility > 0 ? "true" : "false"
      element.dataset.spherFront = front ? "true" : "false"
      element.dataset.spherSelected = projected.item.id === state.selectedId ? "true" : "false"
      element.style.transform = `translate(-50%, -50%) rotateY(${cssNumber(
        projected.item.longitude,
      )}deg) rotateX(${cssNumber(projected.item.latitude)}deg) translateZ(-${cssNumber(
        projected.item.radius,
      )}px) rotateZ(${cssNumber(projected.item.roll)}deg)`
      element.style.opacity = cssNumber(visibility)
      element.style.pointerEvents = front ? "auto" : "none"
    }
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!controls().drag) return
    dragStart = { x: event.clientX, y: event.clientY }
    root.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragStart || !controls().drag) return
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y
    dragStart = { x: event.clientX, y: event.clientY }
    state = {
      ...state,
      rotation: {
        x: clamp(state.rotation.x - dy * 0.1, -90, 90),
        y: state.rotation.y + dx * 0.1,
      },
    }
    render()
    emit()
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!controls().drag) return
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
        zoom: clamp(state.zoom - event.deltaY * 0.0014, 0.1, 8),
      }
    } else {
      state = {
        ...state,
        rotation: {
          x: clamp(state.rotation.x - event.deltaY * 0.024, -90, 90),
          y: state.rotation.y + event.deltaX * 0.024,
        },
      }
    }
    render()
    emit()
  }

  const handleClick = (event: MouseEvent) => {
    const rect = root.getBoundingClientRect()
    const hit = findNearestProjectedItem(
      event.clientX,
      event.clientY,
      Array.from(projections.values()).filter(({ front }) => front),
      rect,
    )
    if (hit) {
      const item = state.items.find(({ id }) => id === hit.id)
      if (item) selectItem(item)
    }
  }

  const update = (patch: Partial<SpherDomOptions<TItem>>) => {
    stateOptions = { ...stateOptions, ...patch }
    state = {
      ...state,
      ...normalizeOptions(stateOptions),
    }
    render()
    emit()
  }

  const select = (id: string | null) => {
    const item = id ? state.items.find((candidate) => candidate.id === id) : null
    stateOptions = { ...stateOptions, selectedId: id }
    state = { ...state, selectedId: id }
    if (item) stateOptions.onSelect?.(item)
    render()
    emit()
  }

  const rotateTo = (rotation: SpherDomState<TItem>["rotation"]) => {
    update({ rotation })
  }

  const destroy = () => {
    destroyed = true
    root.removeEventListener("pointerdown", handlePointerDown)
    root.removeEventListener("pointermove", handlePointerMove)
    root.removeEventListener("pointerup", handlePointerUp)
    root.removeEventListener("pointercancel", handlePointerUp)
    root.removeEventListener("wheel", handleWheel)
    root.removeEventListener("click", handleClick)
    for (const element of elements.values()) {
      element.removeEventListener("click", handleItemClick)
    }
    layer.remove()
    root.style.position = previousRootPosition
    root.style.perspective = previousRootPerspective
    root.style.overflow = previousRootOverflow
    delete root.dataset.spherRoot
    elements.clear()
    createdElements.clear()
    projections.clear()
    listeners.clear()
  }

  const itemState = (id: string): SpherDomItemState<TItem> | null => {
    const projection = projections.get(id)
    if (!projection) return null

    return {
      item: projection.item,
      front: projection.front,
      visible: projection.visibility > 0,
      visibility: projection.visibility,
      selected: projection.item.id === state.selectedId,
    }
  }

  root.addEventListener("pointerdown", handlePointerDown)
  root.addEventListener("pointermove", handlePointerMove)
  root.addEventListener("pointerup", handlePointerUp)
  root.addEventListener("pointercancel", handlePointerUp)
  root.addEventListener("wheel", handleWheel, { passive: false })
  root.addEventListener("click", handleClick)
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
): SpherDomState<TItem> => ({
  items: options.items,
  radius: options.radius ?? defaultRadius,
  perspective: options.perspective ?? defaultPerspective,
  rotation: options.rotation ?? defaultRotation,
  zoom: options.zoom ?? defaultZoom,
  placement: options.placement ?? defaultPlacement,
  selectedId: options.selectedId ?? null,
})
