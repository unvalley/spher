import {
  type CanvasHTMLAttributes,
  forwardRef,
  type ReactElement,
  type Ref,
  type RefObject,
  useEffect,
  useRef,
} from "react"
import type { SpherInstance, SpherItem } from "../canvas/index.js"
import { createSpher, type SpherOptions } from "../create-spher.js"

export type UseSpherOptions<TItem extends SpherItem = SpherItem> = SpherOptions<TItem>

export type UseSpherResult<TItem extends SpherItem = SpherItem> = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  instanceRef: RefObject<SpherInstance<TItem> | null>
}

export type SpherProps<TItem extends SpherItem = SpherItem> = UseSpherOptions<TItem> &
  Omit<CanvasHTMLAttributes<HTMLCanvasElement>, "children" | "onSelect">

export const useSpher = <TItem extends SpherItem>(
  options: UseSpherOptions<TItem>,
): UseSpherResult<TItem> => {
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

const SpherComponent = <TItem extends SpherItem>(
  props: SpherProps<TItem>,
  forwardedRef: Ref<HTMLCanvasElement>,
) => {
  const {
    card,
    controls,
    devicePixelRatio,
    faceMode,
    items,
    onSelect,
    perspective,
    placement,
    position,
    radius,
    render,
    rotation,
    selectedId,
    size,
    tilt,
    zoom,
    ...canvasProps
  } = props
  const { canvasRef } = useSpher({
    card,
    controls,
    devicePixelRatio,
    faceMode,
    items,
    onSelect,
    perspective,
    placement,
    position,
    radius,
    render,
    rotation,
    selectedId,
    size,
    tilt,
    zoom,
  })

  return <canvas {...canvasProps} ref={mergeRefs(canvasRef, forwardedRef)} />
}

export const Spher = forwardRef(SpherComponent) as <TItem extends SpherItem = SpherItem>(
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
