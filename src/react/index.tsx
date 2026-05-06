import {
  type CanvasHTMLAttributes,
  type CSSProperties,
  forwardRef,
  type ReactElement,
  type Ref,
  type RefObject,
  useEffect,
  useRef,
} from "react"
import type { SpherInstance, SpherItem } from "../canvas/index.js"
import { createSpher, type SpherOptions } from "../create-spher.js"

export type SpherProps<TItem = SpherItem> = Omit<SpherOptions<TItem>, "onSelect"> & {
  onItemSelect?: SpherOptions<TItem>["onSelect"]
} & Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "children" | "onSelect">

export const useSpher = <TItem,>(options: SpherOptions<TItem>) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const instanceRef = useRef<SpherInstance<TItem> | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const instance = createSpher(canvas, optionsRef.current)
    instanceRef.current = instance

    return () => {
      instance.destroy()
      if (instanceRef.current === instance) instanceRef.current = null
    }
  }, [])

  useEffect(() => {
    instanceRef.current?.update(options)
  })

  return { canvasRef, instanceRef }
}

const SpherComponent = <TItem,>(props: SpherProps<TItem>, forwardedRef: Ref<HTMLCanvasElement>) => {
  const {
    card,
    controls,
    devicePixelRatio,
    faceMode,
    items,
    onItemSelect,
    perspective,
    placement,
    position,
    radius,
    render: itemRenderer,
    rotation,
    selectedId,
    size,
    tilt,
    zoom,
    style,
    ...canvasProps
  } = props
  const baseOptions = {
    controls,
    devicePixelRatio,
    faceMode,
    items,
    onSelect: onItemSelect,
    perspective,
    placement,
    position,
    radius,
    rotation,
    selectedId,
    size,
    tilt,
    zoom,
  }
  const options = card
    ? ({ ...baseOptions, card } as SpherOptions<TItem>)
    : ({ ...baseOptions, render: itemRenderer } as SpherOptions<TItem>)
  const { canvasRef } = useSpher(options)

  return (
    <canvas
      {...canvasProps}
      ref={mergeRefs(canvasRef, forwardedRef)}
      style={{ ...defaultCanvasStyle, ...style }}
    />
  )
}

export const Spher = forwardRef(SpherComponent) as <TItem = SpherItem>(
  props: SpherProps<TItem> & { ref?: Ref<HTMLCanvasElement> },
) => ReactElement | null

const mergeRefs =
  <TValue,>(...refs: Array<Ref<TValue> | RefObject<TValue | null> | undefined>) =>
  (value: TValue | null) => {
    for (const ref of refs) {
      if (!ref) continue
      setRef(ref, value)
    }
  }

const setRef = <TValue,>(ref: Ref<TValue> | RefObject<TValue | null>, value: TValue | null) => {
  if (typeof ref === "function") {
    ref(value)
    return
  }
  const writableRef = ref as { current: TValue | null }
  writableRef.current = value
}

const defaultCanvasStyle: CSSProperties = {
  display: "block",
  touchAction: "none",
}
