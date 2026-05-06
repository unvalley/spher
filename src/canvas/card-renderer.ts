import type { SpherCardStyle } from "../create-spher.js"
import type { SpherItem, SpherRenderState } from "./types.js"

const cardAspectRatio = 3 / 4
const cardCornerRadius = 4
const cardCoverRadius = 2
const cardInset = 3
const cardWidthOffset = 4

type SpherCardFrame = {
  x: number
  y: number
  width: number
  height: number
  coverX: number
  coverY: number
  coverWidth: number
  coverHeight: number
  drawMain: boolean
  cardAlpha: number
}

type SpherCardRendererOptions<TItem = SpherItem> = {
  cover: (item: TItem & SpherItem) => CanvasImageSource | undefined
  style?: SpherCardStyle
}

const defaultFallbackColors = ["#e5e7eb", "#94a3b8"] as const

export const createCardRenderer = <TItem = SpherItem>(options: SpherCardRendererOptions<TItem>) => {
  return (context, item, state) => {
    const frame = createCardFrame(state)

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
      cardCoverRadius,
    )
    context.clip()

    const cover = options.cover(item)
    if (frame.drawMain) {
      drawCardCover(context, cover, frame)
    } else {
      drawCardBack(context, cover, frame)
    }

    drawCardLight(context, frame)
    context.restore()
    context.restore()
  }
}

const drawFallbackCard = (
  context: CanvasRenderingContext2D,
  frame: Pick<SpherCardFrame, "coverHeight" | "coverWidth" | "coverX" | "coverY">,
) => {
  const fallback = context.createLinearGradient(
    frame.coverX,
    frame.coverY,
    frame.coverX + frame.coverWidth,
    frame.coverY + frame.coverHeight,
  )
  fallback.addColorStop(0, defaultFallbackColors[0])
  fallback.addColorStop(1, defaultFallbackColors[1])
  context.fillStyle = fallback
  context.fillRect(frame.coverX, frame.coverY, frame.coverWidth, frame.coverHeight)
}

const drawCardBack = (
  context: CanvasRenderingContext2D,
  cover: CanvasImageSource | undefined,
  frame: Pick<SpherCardFrame, "coverHeight" | "coverWidth" | "coverX" | "coverY">,
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

const drawCardCover = (
  context: CanvasRenderingContext2D,
  cover: CanvasImageSource | undefined,
  frame: Pick<SpherCardFrame, "coverHeight" | "coverWidth" | "coverX" | "coverY">,
) => {
  if (isDrawableCover(cover)) {
    drawCover(context, cover, frame.coverX, frame.coverY, frame)
  } else {
    drawFallbackCard(context, frame)
  }
}

const drawCover = (
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

const createCardFrame = <TItem>(state: SpherRenderState<TItem>): SpherCardFrame => {
  const inset = cardInset
  const width = state.item.size + cardWidthOffset
  const coverWidth = width - inset * 2
  const coverHeight = coverWidth / cardAspectRatio
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
    drawMain: state.coverVisible || faceIn || insideView,
    cardAlpha: getCardAlpha({ faceIn, faceOutBack, insideView, state }),
  }
}

const getCardAlpha = <TItem>({
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

const drawCardFrame = <TItem>(
  context: CanvasRenderingContext2D,
  state: SpherRenderState<TItem>,
  { drawMain, height, width, x, y }: SpherCardFrame,
  options: Pick<SpherCardRendererOptions<TItem>, "style">,
) => {
  const style = options.style
  if (state.selected) {
    context.shadowBlur = 18
    context.shadowColor = "rgba(15, 23, 42, 0.24)"
  }

  context.fillStyle = drawMain ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.46)"
  context.strokeStyle = state.selected
    ? (style?.selectedBorderColor ?? "rgba(17, 24, 39, 0.96)")
    : drawMain
      ? (style?.borderColor ?? "rgba(15, 23, 42, 0.16)")
      : (style?.backBorderColor ?? style?.borderColor ?? "rgba(15, 23, 42, 0.2)")
  context.lineWidth = state.selected ? (style?.selectedBorderWidth ?? 2) : (style?.borderWidth ?? 1)
  roundedRect(context, x, y, width, height, cardCornerRadius)
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

const isDrawableCover = (
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
