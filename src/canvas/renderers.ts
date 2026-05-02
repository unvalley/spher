import type { SpherCanvasItem, SpherCanvasRenderState } from "./types.js"

export type SpherCanvasRenderer<TItem extends SpherCanvasItem = SpherCanvasItem> = (
  context: CanvasRenderingContext2D,
  item: TItem,
  state: SpherCanvasRenderState<TItem>,
) => void

export type SpherCanvasPreloadableRenderer<TItem extends SpherCanvasItem = SpherCanvasItem> =
  SpherCanvasRenderer<TItem> & {
    preload: (items: TItem[], onLoad?: () => void) => void
  }

export type SpherCanvasImageSource = string | HTMLImageElement | null | undefined

export type SpherCanvasColorPair = readonly [string, string]

export type SpherCanvasImageCardRendererOptions<TItem extends SpherCanvasItem = SpherCanvasItem> = {
  image: (item: TItem) => SpherCanvasImageSource
  colors?:
    | Record<string, SpherCanvasColorPair>
    | ((item: TItem) => SpherCanvasColorPair | null | undefined)
  tone?: (item: TItem) => string | null | undefined
  fallbackColors?: SpherCanvasColorPair
  imageAspectRatio?: number
  inset?: number
  radius?: number
  mediaRadius?: number
  widthOffset?: number
}

type CachedImage = {
  image: HTMLImageElement
  src: string
}

const defaultFallbackColors = ["#e5e7eb", "#94a3b8"] as const

export const createImageCardRenderer = <TItem extends SpherCanvasItem>(
  options: SpherCanvasImageCardRendererOptions<TItem>,
): SpherCanvasPreloadableRenderer<TItem> => {
  const cache = new Map<string, CachedImage>()
  let notifyImageLoad: (() => void) | undefined

  const resolveImage = (item: TItem) => {
    const source = options.image(item)
    if (!source) return undefined
    if (typeof source !== "string") return source

    const cached = cache.get(item.id)
    if (cached?.src === source) return cached.image

    const image = new Image()
    image.decoding = "async"
    image.onload = () => notifyImageLoad?.()
    image.src = source
    cache.set(item.id, { image, src: source })
    return image
  }

  const renderer = ((context, item, state) => {
    const widthOffset = options.widthOffset ?? 4
    const inset = options.inset ?? 3
    const imageAspectRatio = options.imageAspectRatio ?? 3 / 4
    const width = state.item.size + widthOffset
    const mediaWidth = width - inset * 2
    const mediaHeight = mediaWidth / imageAspectRatio
    const height = mediaHeight + inset * 2
    const x = -width / 2
    const y = -height / 2
    const mediaX = x + inset
    const mediaY = y + inset
    const image = resolveImage(item)
    const colors = resolveColors(options, item)
    const faceIn = state.faceMode === "face-in"
    const faceOutBack = state.faceMode === "face-out" && state.visibleSide === "inside"
    const insideView = state.viewMode === "inside"
    const drawMainImage = state.imageVisible || faceIn || insideView
    const surfaceAlpha = insideView
      ? 0.86
      : faceOutBack
        ? 0.54
        : faceIn
          ? state.visibleSide === "outside"
            ? 0.4
            : 0.72
          : 1

    context.save()
    context.globalAlpha *= surfaceAlpha
    if (state.selected) {
      context.shadowBlur = 18
      context.shadowColor = "rgba(15, 23, 42, 0.24)"
    }

    context.fillStyle = drawMainImage ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.46)"
    context.strokeStyle = state.selected
      ? "rgba(17, 24, 39, 0.96)"
      : drawMainImage
        ? "rgba(15, 23, 42, 0.16)"
        : "rgba(15, 23, 42, 0.2)"
    context.lineWidth = state.selected ? 2 : 1
    roundedRect(context, x, y, width, height, options.radius ?? 4)
    context.fill()
    context.stroke()

    context.save()
    roundedRect(context, mediaX, mediaY, mediaWidth, mediaHeight, options.mediaRadius ?? 2)
    context.clip()

    if (!drawMainImage) {
      drawCardBack(context, image, mediaX, mediaY, mediaWidth, mediaHeight, colors)
    } else if (image?.complete && image.naturalWidth > 0) {
      drawCoverImage(context, image, mediaX, mediaY, mediaWidth, mediaHeight)
    } else {
      drawFallback(context, mediaX, mediaY, mediaWidth, mediaHeight, colors)
    }

    const light = context.createLinearGradient(
      mediaX,
      mediaY,
      mediaX + mediaWidth,
      mediaY + mediaHeight,
    )
    light.addColorStop(0, "rgba(255, 255, 255, 0.42)")
    light.addColorStop(0.48, "rgba(255, 255, 255, 0)")
    light.addColorStop(1, "rgba(15, 23, 42, 0.16)")
    if (drawMainImage) {
      context.fillStyle = light
      context.fillRect(mediaX, mediaY, mediaWidth, mediaHeight)
    }
    context.restore()
    context.restore()
  }) as SpherCanvasPreloadableRenderer<TItem>

  renderer.preload = (items, onLoad) => {
    notifyImageLoad = onLoad
    for (const item of items) resolveImage(item)
  }

  return renderer
}

const resolveColors = <TItem extends SpherCanvasItem>(
  options: SpherCanvasImageCardRendererOptions<TItem>,
  item: TItem,
): SpherCanvasColorPair => {
  if (typeof options.colors === "function") {
    return options.colors(item) ?? options.fallbackColors ?? defaultFallbackColors
  }

  const tone = options.tone?.(item)
  if (tone && options.colors?.[tone]) return options.colors[tone]
  return options.fallbackColors ?? defaultFallbackColors
}

const drawFallback = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: SpherCanvasColorPair,
) => {
  const fallback = context.createLinearGradient(x, y, x + width, y + height)
  fallback.addColorStop(0, colors[0])
  fallback.addColorStop(1, colors[1])
  context.fillStyle = fallback
  context.fillRect(x, y, width, height)
}

const drawCardBack = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: SpherCanvasColorPair,
) => {
  if (image?.complete && image.naturalWidth > 0) {
    context.save()
    context.translate(x + width / 2, y + height / 2)
    context.scale(-1, 1)
    context.filter = "saturate(0.68) contrast(0.94) brightness(0.92)"
    drawCoverImage(context, image, -width / 2, -height / 2, width, height)
    context.restore()
  } else {
    drawFallback(context, x, y, width, height, colors)
  }

  const backing = context.createLinearGradient(x, y, x + width, y + height)
  backing.addColorStop(0, "rgba(255, 255, 255, 0.3)")
  backing.addColorStop(0.5, "rgba(15, 23, 42, 0.06)")
  backing.addColorStop(1, "rgba(15, 23, 42, 0.16)")
  context.fillStyle = backing
  context.fillRect(x, y, width, height)

  context.strokeStyle = "rgba(15, 23, 42, 0.18)"
  context.lineWidth = 1
  context.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)
}

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
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
