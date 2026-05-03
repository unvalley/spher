import { createSpher } from "./create-spher-canvas.js"
import type { SpherColorPair, SpherRenderer } from "./renderer-types.js"
import type {
  SpherInstance,
  SpherItem,
  SpherOptions,
  SpherRenderState,
} from "./types.js"

export type SpherSurfaceFrame = {
  x: number
  y: number
  width: number
  height: number
  mediaX: number
  mediaY: number
  mediaWidth: number
  mediaHeight: number
  colors: SpherColorPair
  drawMain: boolean
  surfaceAlpha: number
}

export type SpherSurfaceContent<TItem extends SpherItem = SpherItem> = (
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherRenderState<TItem>,
  frame: SpherSurfaceFrame,
) => void

export type SpherSurfaceRendererOptions<TItem extends SpherItem = SpherItem> = {
  colors?:
    | Record<string, SpherColorPair>
    | ((item: TItem) => SpherColorPair | null | undefined)
  tone?: (item: TItem) => string | null | undefined
  fallbackColors?: SpherColorPair
  aspectRatio?: number
  inset?: number
  cornerRadius?: number
  mediaRadius?: number
  widthOffset?: number
  render?: SpherSurfaceContent<TItem>
  renderBack?: SpherSurfaceContent<TItem>
}

export type SpherSurfaceSpherOptions<TItem extends SpherItem = SpherItem> = Omit<
  SpherOptions<TItem>,
  "render"
> &
  SpherSurfaceRendererOptions<TItem>

export type SpherSurfaceInstance<TItem extends SpherItem = SpherItem> =
  SpherInstance<TItem> & {
    renderer: SpherRenderer<TItem>
  }

const defaultFallbackColors = ["#e5e7eb", "#94a3b8"] as const

export const createSurfaceRenderer = <TItem extends SpherItem>(
  options: SpherSurfaceRendererOptions<TItem> = {},
): SpherRenderer<TItem> => {
  return (context, item, state) => {
    const frame = createSurfaceFrame(options, item, state)

    context.save()
    context.globalAlpha *= frame.surfaceAlpha
    drawSurfaceFrame(context, state, frame, options)

    context.save()
    roundedRect(
      context,
      frame.mediaX,
      frame.mediaY,
      frame.mediaWidth,
      frame.mediaHeight,
      options.mediaRadius ?? 2,
    )
    context.clip()

    if (frame.drawMain) {
      drawMainSurfaceContent(context, item, state, frame, options)
    } else {
      drawBackSurfaceContent(context, item, state, frame, options)
    }

    drawSurfaceLight(context, frame)
    context.restore()
    context.restore()
  }
}

export const createSurfaceSpher = <TItem extends SpherItem>(
  canvas: HTMLCanvasElement,
  options: SpherSurfaceSpherOptions<TItem>,
): SpherSurfaceInstance<TItem> => {
  const { canvasOptions, rendererOptions } = splitSurfaceOptions(options)
  const renderer = createSurfaceRenderer<TItem>(rendererOptions)
  const instance = createSpher(canvas, { ...canvasOptions, render: renderer })

  return {
    ...instance,
    renderer,
  }
}

export const drawFallbackSurface = (
  context: CanvasRenderingContext2D,
  frame: Pick<
    SpherSurfaceFrame,
    "colors" | "mediaHeight" | "mediaWidth" | "mediaX" | "mediaY"
  >,
) => {
  const fallback = context.createLinearGradient(
    frame.mediaX,
    frame.mediaY,
    frame.mediaX + frame.mediaWidth,
    frame.mediaY + frame.mediaHeight,
  )
  fallback.addColorStop(0, frame.colors[0])
  fallback.addColorStop(1, frame.colors[1])
  context.fillStyle = fallback
  context.fillRect(frame.mediaX, frame.mediaY, frame.mediaWidth, frame.mediaHeight)
}

export const drawImageSurfaceBack = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  frame: Pick<
    SpherSurfaceFrame,
    "colors" | "mediaHeight" | "mediaWidth" | "mediaX" | "mediaY"
  >,
) => {
  if (image?.complete && image.naturalWidth > 0) {
    context.save()
    context.translate(frame.mediaX + frame.mediaWidth / 2, frame.mediaY + frame.mediaHeight / 2)
    context.scale(-1, 1)
    context.filter = "saturate(0.68) contrast(0.94) brightness(0.92)"
    drawCoverImage(context, image, -frame.mediaWidth / 2, -frame.mediaHeight / 2, frame)
    context.restore()
  } else {
    drawFallbackSurface(context, frame)
  }

  const backing = context.createLinearGradient(
    frame.mediaX,
    frame.mediaY,
    frame.mediaX + frame.mediaWidth,
    frame.mediaY + frame.mediaHeight,
  )
  backing.addColorStop(0, "rgba(255, 255, 255, 0.3)")
  backing.addColorStop(0.5, "rgba(15, 23, 42, 0.06)")
  backing.addColorStop(1, "rgba(15, 23, 42, 0.16)")
  context.fillStyle = backing
  context.fillRect(frame.mediaX, frame.mediaY, frame.mediaWidth, frame.mediaHeight)

  context.strokeStyle = "rgba(15, 23, 42, 0.18)"
  context.lineWidth = 1
  context.strokeRect(
    frame.mediaX + 0.5,
    frame.mediaY + 0.5,
    frame.mediaWidth - 1,
    frame.mediaHeight - 1,
  )
}

export const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  {
    mediaHeight: height,
    mediaWidth: width,
  }: Pick<SpherSurfaceFrame, "mediaHeight" | "mediaWidth">,
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

const splitSurfaceOptions = <TItem extends SpherItem>({
  aspectRatio,
  colors,
  cornerRadius,
  fallbackColors,
  inset,
  mediaRadius,
  radius,
  render,
  renderBack,
  tone,
  widthOffset,
  ...canvasOptions
}: SpherSurfaceSpherOptions<TItem>) => ({
  canvasOptions,
  rendererOptions: {
    aspectRatio,
    colors,
    cornerRadius,
    fallbackColors,
    inset,
    mediaRadius,
    radius,
    render,
    renderBack,
    tone,
    widthOffset,
  },
})

const createSurfaceFrame = <TItem extends SpherItem>(
  options: SpherSurfaceRendererOptions<TItem>,
  item: TItem,
  state: SpherRenderState<TItem>,
): SpherSurfaceFrame => {
  const inset = options.inset ?? 3
  const width = state.item.size + (options.widthOffset ?? 4)
  const mediaWidth = width - inset * 2
  const mediaHeight = mediaWidth / (options.aspectRatio ?? 3 / 4)
  const height = mediaHeight + inset * 2
  const faceIn = state.faceMode === "face-in"
  const faceOutBack = state.faceMode === "face-out" && state.visibleSide === "inside"
  const insideView = state.viewMode === "inside"

  return {
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    mediaX: -width / 2 + inset,
    mediaY: -height / 2 + inset,
    mediaWidth,
    mediaHeight,
    colors: resolveColors(options, item),
    drawMain: state.imageVisible || faceIn || insideView,
    surfaceAlpha: getSurfaceAlpha({ faceIn, faceOutBack, insideView, state }),
  }
}

const drawMainSurfaceContent = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherRenderState<TItem>,
  frame: SpherSurfaceFrame,
  options: SpherSurfaceRendererOptions<TItem>,
) => {
  if (options.render) {
    options.render(context, item, state, frame)
    return
  }
  drawFallbackSurface(context, frame)
}

const drawBackSurfaceContent = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherRenderState<TItem>,
  frame: SpherSurfaceFrame,
  options: SpherSurfaceRendererOptions<TItem>,
) => {
  if (options.renderBack) {
    options.renderBack(context, item, state, frame)
    return
  }
  drawImageSurfaceBack(context, undefined, frame)
}

const resolveColors = <TItem extends SpherItem>(
  options: SpherSurfaceRendererOptions<TItem>,
  item: TItem,
): SpherColorPair => {
  if (typeof options.colors === "function") {
    return options.colors(item) ?? options.fallbackColors ?? defaultFallbackColors
  }

  const tone = options.tone?.(item)
  if (tone && options.colors?.[tone]) return options.colors[tone]
  return options.fallbackColors ?? defaultFallbackColors
}

const getSurfaceAlpha = <TItem extends SpherItem>({
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

const drawSurfaceFrame = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  state: SpherRenderState<TItem>,
  { drawMain, height, width, x, y }: SpherSurfaceFrame,
  options: Pick<SpherSurfaceRendererOptions<TItem>, "cornerRadius">,
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

const drawSurfaceLight = (
  context: CanvasRenderingContext2D,
  { drawMain, mediaHeight, mediaWidth, mediaX, mediaY }: SpherSurfaceFrame,
) => {
  if (!drawMain) return

  const light = context.createLinearGradient(
    mediaX,
    mediaY,
    mediaX + mediaWidth,
    mediaY + mediaHeight,
  )
  light.addColorStop(0, "rgba(255, 255, 255, 0.42)")
  light.addColorStop(0.48, "rgba(255, 255, 255, 0)")
  light.addColorStop(1, "rgba(15, 23, 42, 0.16)")
  context.fillStyle = light
  context.fillRect(mediaX, mediaY, mediaWidth, mediaHeight)
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
