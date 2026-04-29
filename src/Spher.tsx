"use client"

import {
  type CSSProperties,
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import type { SpherPlacement } from "./core/types.js"
import {
  createSpher,
  type SpherDomControls,
  type SpherDomFaceDirection,
  type SpherDomInstance,
  type SpherDomItem,
  type SpherDomItemState,
  type SpherDomOptions,
  type SpherDomPosition,
} from "./dom/index.js"

export type SpherRenderState<TItem extends SpherDomItem> = {
  selected: boolean
  edgeFactor: number
  faceDirection: SpherDomFaceDirection
  front: boolean
  insideScale: number
  interactive: boolean
  normalY: number
  perspectiveScale: number
  visible: boolean
  visibility: number
  itemState: SpherDomItemState<TItem> | null
  viewMode: SpherDomItemState<TItem>["viewMode"]
  select: () => void
}

export type SpherProps<TItem extends SpherDomItem> = {
  items: TItem[]
  radius?: number
  perspective?: number
  insideZoomThreshold?: number
  minZoom?: number
  maxZoom?: number
  rotation?: {
    x: number
    y: number
  }
  zoom?: number
  faceDirection?: SpherDomFaceDirection
  placement?: SpherPlacement
  controls?: SpherDomControls
  selectedId?: string | null
  defaultSelectedId?: string | null
  className?: string
  style?: CSSProperties
  position?: (item: TItem, index: number, items: TItem[]) => SpherDomPosition | null | undefined
  size?: number | ((item: TItem, index: number, items: TItem[]) => number)
  render: (item: TItem, state: SpherRenderState<TItem>) => ReactNode
  onSelect?: (item: TItem) => void
}

export type SpherHandle<TItem extends SpherDomItem = SpherDomItem> = SpherDomInstance<TItem>

const SpherInner = <TItem extends SpherDomItem>(
  {
    items,
    radius,
    perspective,
    insideZoomThreshold,
    minZoom,
    maxZoom,
    rotation,
    zoom,
    faceDirection,
    placement,
    controls = true,
    selectedId,
    defaultSelectedId = null,
    className,
    style,
    position,
    size,
    render,
    onSelect,
  }: SpherProps<TItem>,
  ref: ForwardedRef<SpherHandle<TItem>>,
) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const itemElementsRef = useRef(new Map<string, HTMLElement>())
  const instanceRef = useRef<SpherDomInstance<TItem> | null>(null)
  const latestSelectRef = useRef({ onSelect, selectedId })
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(defaultSelectedId)
  const [, setRevision] = useState(0)
  const effectiveSelectedId = selectedId ?? internalSelectedId

  latestSelectRef.current = { onSelect, selectedId }

  useImperativeHandle(
    ref,
    () => ({
      update: (patch) => instanceRef.current?.update(patch),
      select: (id) => instanceRef.current?.select(id),
      rotateTo: (rotation) => instanceRef.current?.rotateTo(rotation),
      destroy: () => instanceRef.current?.destroy(),
      itemState: (id) => instanceRef.current?.itemState(id) ?? null,
      getState: () => {
        const state = instanceRef.current?.getState()
        if (!state) {
          throw new Error("Spher is not mounted.")
        }
        return state
      },
      subscribe: (listener) => instanceRef.current?.subscribe(listener) ?? (() => undefined),
    }),
    [],
  )

  useLayoutEffect(() => {
    const root = rootRef.current
    const layer = layerRef.current
    if (!root || !layer) return

    const instanceOptions = {
      items: [],
      layer,
      element: (item) => itemElementsRef.current.get(item.id) ?? null,
      onSelect: (item) => {
        const latest = latestSelectRef.current
        if (latest.selectedId === undefined) setInternalSelectedId(item.id)
        latest.onSelect?.(item)
      },
    } as SpherDomOptions<TItem> & { layer: HTMLElement }

    const instance = createSpher<TItem>(root, instanceOptions)

    instanceRef.current = instance
    const unsubscribe = instance.subscribe(() => setRevision((revision) => revision + 1))
    setRevision((revision) => revision + 1)

    return () => {
      unsubscribe()
      instance.destroy()
      instanceRef.current = null
    }
  }, [])

  useLayoutEffect(() => {
    instanceRef.current?.update({
      items,
      radius,
      perspective,
      insideZoomThreshold,
      minZoom,
      maxZoom,
      rotation,
      zoom,
      faceDirection,
      placement,
      controls,
      selectedId: effectiveSelectedId,
      position,
      size,
    })
  }, [
    controls,
    effectiveSelectedId,
    position,
    size,
    items,
    faceDirection,
    insideZoomThreshold,
    maxZoom,
    minZoom,
    perspective,
    placement,
    radius,
    rotation,
    zoom,
  ])

  return (
    <div className={className} data-spher-react ref={rootRef} style={style}>
      <div data-spher-react-layer ref={layerRef}>
        {items.map((item) => {
          const itemState = instanceRef.current?.itemState(item.id) ?? null
          const itemSelected = effectiveSelectedId === item.id
          const renderState: SpherRenderState<TItem> = {
            selected: itemSelected,
            edgeFactor: itemState?.edgeFactor ?? 0,
            faceDirection: itemState?.faceDirection ?? "inward",
            front: itemState?.front ?? false,
            insideScale: itemState?.insideScale ?? 1,
            interactive: itemState?.interactive ?? false,
            normalY: itemState?.normalY ?? 0,
            perspectiveScale: itemState?.perspectiveScale ?? 1,
            visible: itemState?.visible ?? false,
            visibility: itemState?.visibility ?? 0,
            itemState,
            viewMode: itemState?.viewMode ?? "shell",
            select: () => {
              instanceRef.current?.select(item.id)
            },
          }

          return (
            <div
              data-spher-slot={item.id}
              key={item.id}
              ref={(element) => {
                if (element) {
                  itemElementsRef.current.set(item.id, element)
                } else {
                  itemElementsRef.current.delete(item.id)
                }
              }}
            >
              {render(item, renderState)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const Spher = forwardRef(SpherInner) as <TItem extends SpherDomItem>(
  props: SpherProps<TItem> & {
    ref?: ForwardedRef<SpherHandle<TItem>>
  },
) => ReactNode
