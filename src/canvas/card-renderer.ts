import { createSpher } from "./create-spher-canvas.js"
import type { SpherColorPair, SpherRenderer } from "./renderer-types.js"
import type { SpherInstance, SpherItem, SpherOptions, SpherRenderState } from "./types.js"

export type SpherCardFrame = {
  x: number
  y: number
  width: number
  height: number
  coverX: number
  coverY: number
  coverWidth: number
  coverHeight: number
  colors: SpherColorPair
  drawMain: boolean
  cardAlpha: number
}

export type SpherCardContent<TItem extends SpherItem = SpherItem> = (
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherRenderState<TItem>,
  frame: SpherCardFrame,
) => void

export type SpherCardRendererOptions<TItem extends SpherItem = SpherItem> = {
  /** Color palette keyed by tone, or a resolver that returns colors per item. */
  colors?: Record<string, SpherColorPair> | ((item: TItem) => SpherColorPair | null | undefined)
  /** Resolves the tone key used to pick colors from a `colors` record. */
  tone?: (item: TItem) => string | null | undefined
  /** Colors used when no item-specific colors are resolved. */
  fallbackColors?: SpherColorPair
  /** Aspect ratio for the cover area. Defaults to 3 / 4. */
  aspectRatio?: number
  /** Padding between the card edge and cover area in CSS pixels. */
  inset?: number
  /** Outer card corner radius in CSS pixels. */
  cornerRadius?: number
  /** Cover clipping radius in CSS pixels. */
  coverRadius?: number
  /** Extra card width added to the placed item size. */
  widthOffset?: number
  /** Custom drawing hook for the main card side. */
  render?: SpherCardContent<TItem>
  /** Custom drawing hook for the back side. */
  renderBack?: SpherCardContent<TItem>
}

export type SpherCardSpherOptions<TItem extends SpherItem = SpherItem> = Omit<
  SpherOptions<TItem>,
  "render"
> &
  SpherCardRendererOptions<TItem>

const defaultFallbackColors = ["#e5e7eb", "#94a3b8"] as const

export const createCardRenderer = <TItem extends SpherItem>(
  options: SpherCardRendererOptions<TItem> = {},
): SpherRenderer<TItem> => {
  return (context, item, state) => {
    const frame = createCardFrame(options, state)

    context.save()
    context.globalAlpha *= frame.cardAlpha
    drawCardFrame(context, state, frame, options)

    context.save()
    roundedRect(
      context,
      frame.coverX,
      frame.coverY,
      frame.coverWidth,
      frame.coverHeight,
      options.coverRadius ?? 2,
    )
    context.clip()

    if (frame.drawMain) {
      drawMainCardContent(context, item, state, frame, options)
    } else {
      drawBackCardContent(context, item, state, frame, options)
    }

    drawCardLight(context, frame)
    context.restore()
    context.restore()
  }
}

export const createCardSpher = <TItem extends SpherItem>(
  canvas: HTMLCanvasElement,
  options: SpherCardSpherOptions<TItem>,
): SpherInstance<TItem> => {
  const { canvasOptions, rendererOptions } = splitCardOptions(options)
  const renderer = createCardRenderer<TItem>(rendererOptions)
  return createSpher(canvas, { ...canvasOptions, render: renderer })
}

export const drawFallbackCard = (
  context: CanvasRenderingContext2D,
  frame: Pick<SpherCardFrame, "colors" | "coverHeight" | "coverWidth" | "coverX" | "coverY">,
) => {
  const fallback = context.createLinearGradient(
    frame.coverX,
    frame.coverY,
    frame.coverX + frame.coverWidth,
    frame.coverY + frame.coverHeight,
  )
  fallback.addColorStop(0, frame.colors[0])
  fallback.addColorStop(1, frame.colors[1])
  context.fillStyle = fallback
  context.fillRect(frame.coverX, frame.coverY, frame.coverWidth, frame.coverHeight)
}

export const drawCardBack = (
  context: CanvasRenderingContext2D,
  cover: CanvasImageSource | undefined,
  frame: Pick<SpherCardFrame, "colors" | "coverHeight" | "coverWidth" | "coverX" | "coverY">,
) => {
  if (isDrawableCover(cover)) {
    context.save()
    context.translate(frame.coverX + frame.coverWidth / 2, frame.coverY + frame.coverHeight / 2)
    context.scale(-1, 1)
    context.filter = "saturate(0.68) contrast(0.94) brightness(0.92)"
    drawCover(context, cover, -frame.coverWidth / 2, -frame.coverHeight / 2, frame)
    context.restore()
  } else {
    drawFallbackCard(context, frame)
  }

  const backing = context.createLinearGradient(
    frame.coverX,
    frame.coverY,
    frame.coverX + frame.coverWidth,
    frame.coverY + frame.coverHeight,
  )
  backing.addColorStop(0, "rgba(255, 255, 255, 0.3)")
  backing.addColorStop(0.5, "rgba(15, 23, 42, 0.06)")
  backing.addColorStop(1, "rgba(15, 23, 42, 0.16)")
  context.fillStyle = backing
  context.fillRect(frame.coverX, frame.coverY, frame.coverWidth, frame.coverHeight)

  context.strokeStyle = "rgba(15, 23, 42, 0.18)"
  context.lineWidth = 1
  context.strokeRect(
    frame.coverX + 0.5,
    frame.coverY + 0.5,
    frame.coverWidth - 1,
    frame.coverHeight - 1,
  )
}

export const drawCover = (
  context: CanvasRenderingContext2D,
  cover: CanvasImageSource,
  x: number,
  y: number,
  { coverHeight: height, coverWidth: width }: Pick<SpherCardFrame, "coverHeight" | "coverWidth">,
) => {
  const size = getCoverSize(cover)
  const scale = Math.max(width / size.width, height / size.height)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (size.width - sourceWidth) / 2
  const sourceY = (size.height - sourceHeight) / 2
  context.drawImage(cover, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

const splitCardOptions = <TItem extends SpherItem>({
  aspectRatio,
  colors,
  cornerRadius,
  fallbackColors,
  inset,
  coverRadius,
  radius,
  render,
  renderBack,
  tone,
  widthOffset,
  ...canvasOptions
}: SpherCardSpherOptions<TItem>) => ({
  canvasOptions,
  rendererOptions: {
    aspectRatio,
    colors,
    cornerRadius,
    fallbackColors,
    inset,
    coverRadius,
    radius,
    render,
    renderBack,
    tone,
    widthOffset,
  },
})

const createCardFrame = <TItem extends SpherItem>(
  options: SpherCardRendererOptions<TItem>,
  state: SpherRenderState<TItem>,
): SpherCardFrame => {
  const inset = options.inset ?? 3
  const width = state.item.size + (options.widthOffset ?? 4)
  const coverWidth = width - inset * 2
  const coverHeight = coverWidth / (options.aspectRatio ?? 3 / 4)
  const height = coverHeight + inset * 2
  const faceIn = state.faceMode === "face-in"
  const faceOutBack = state.faceMode === "face-out" && state.visibleSide === "inside"
  const insideView = state.viewMode === "inside"

  return {
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    coverX: -width / 2 + inset,
    coverY: -height / 2 + inset,
    coverWidth,
    coverHeight,
    colors: resolveColors(options, state.item),
    drawMain: state.coverVisible || faceIn || insideView,
    cardAlpha: getCardAlpha({ faceIn, faceOutBack, insideView, state }),
  }
}

const drawMainCardContent = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherRenderState<TItem>,
  frame: SpherCardFrame,
  options: SpherCardRendererOptions<TItem>,
) => {
  if (options.render) {
    options.render(context, item, state, frame)
    return
  }
  drawFallbackCard(context, frame)
}

const drawBackCardContent = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherRenderState<TItem>,
  frame: SpherCardFrame,
  options: SpherCardRendererOptions<TItem>,
) => {
  if (options.renderBack) {
    options.renderBack(context, item, state, frame)
    return
  }
  drawCardBack(context, undefined, frame)
}

const resolveColors = <TItem extends SpherItem>(
  options: SpherCardRendererOptions<TItem>,
  item: TItem,
): SpherColorPair => {
  if (typeof options.colors === "function") {
    return options.colors(item) ?? options.fallbackColors ?? defaultFallbackColors
  }

  const tone = options.tone?.(item)
  if (tone && options.colors?.[tone]) return options.colors[tone]
  return options.fallbackColors ?? defaultFallbackColors
}

const getCardAlpha = <TItem extends SpherItem>({
  faceIn,
  faceOutBack,
  insideView,
  state,
}: {
  faceIn: boolean
  faceOutBack: boolean
  insideView: boolean
  state: SpherRenderState<TItem>
}) => {
  if (insideView) return 0.86
  if (faceOutBack) return 0.54
  if (!faceIn) return 1
  return state.visibleSide === "outside" ? 0.4 : 0.72
}

const drawCardFrame = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  state: SpherRenderState<TItem>,
  { drawMain, height, width, x, y }: SpherCardFrame,
  options: Pick<SpherCardRendererOptions<TItem>, "cornerRadius">,
) => {
  if (state.selected) {
    context.shadowBlur = 18
    context.shadowColor = "rgba(15, 23, 42, 0.24)"
  }

  context.fillStyle = drawMain ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.46)"
  context.strokeStyle = state.selected
    ? "rgba(17, 24, 39, 0.96)"
    : drawMain
      ? "rgba(15, 23, 42, 0.16)"
      : "rgba(15, 23, 42, 0.2)"
  context.lineWidth = state.selected ? 2 : 1
  roundedRect(context, x, y, width, height, options.cornerRadius ?? 4)
  context.fill()
  context.stroke()
}

const drawCardLight = (
  context: CanvasRenderingContext2D,
  { drawMain, coverHeight, coverWidth, coverX, coverY }: SpherCardFrame,
) => {
  if (!drawMain) return

  const light = context.createLinearGradient(
    coverX,
    coverY,
    coverX + coverWidth,
    coverY + coverHeight,
  )
  light.addColorStop(0, "rgba(255, 255, 255, 0.42)")
  light.addColorStop(0.48, "rgba(255, 255, 255, 0)")
  light.addColorStop(1, "rgba(15, 23, 42, 0.16)")
  context.fillStyle = light
  context.fillRect(coverX, coverY, coverWidth, coverHeight)
}

export const isDrawableCover = (
  cover: CanvasImageSource | null | undefined,
): cover is CanvasImageSource => {
  if (!cover) return false
  const size = getCoverSize(cover)
  if (size.width <= 0 || size.height <= 0) return false
  if ("complete" in cover && cover.complete === false) return false
  return true
}

const getCoverSize = (cover: CanvasImageSource) => {
  if ("naturalWidth" in cover && cover.naturalWidth > 0) {
    return { width: cover.naturalWidth, height: cover.naturalHeight }
  }
  if ("videoWidth" in cover && cover.videoWidth > 0) {
    return { width: cover.videoWidth, height: cover.videoHeight }
  }
  if ("displayWidth" in cover && cover.displayWidth > 0) {
    return { width: cover.displayWidth, height: cover.displayHeight }
  }
  const sizedCover = cover as { height?: unknown; width?: unknown }
  return {
    height: Number(sizedCover.height) || 0,
    width: Number(sizedCover.width) || 0,
  }
}

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}
