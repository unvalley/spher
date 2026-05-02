import { createSpherCanvas } from "./create-spher-canvas.js"
import type { SpherCanvasImageSource, SpherCanvasPreloadableRenderer } from "./renderer-types.js"
import {
  createSurfaceRenderer,
  drawCoverImage,
  drawFallbackSurface,
  drawImageSurfaceBack,
  type SpherCanvasSurfaceRendererOptions,
} from "./surface-renderer.js"
import type { SpherCanvasInstance, SpherCanvasItem, SpherCanvasOptions } from "./types.js"

export type SpherCanvasImageSurfaceRendererOptions<
  TItem extends SpherCanvasItem = SpherCanvasItem,
> = Omit<SpherCanvasSurfaceRendererOptions<TItem>, "aspectRatio" | "render" | "renderBack"> & {
  image: (item: TItem) => SpherCanvasImageSource
  imageAspectRatio?: number
}

/** @deprecated Use SpherCanvasImageSurfaceRendererOptions instead. */
export type SpherCanvasImageCardRendererOptions<TItem extends SpherCanvasItem = SpherCanvasItem> =
  SpherCanvasImageSurfaceRendererOptions<TItem>

export type SpherCanvasImageSurfaceSpherOptions<TItem extends SpherCanvasItem = SpherCanvasItem> =
  Omit<SpherCanvasOptions<TItem>, "render"> &
    Omit<SpherCanvasImageSurfaceRendererOptions<TItem>, "cornerRadius" | "radius"> & {
      /** Corner radius for each rendered image surface. */
      cornerRadius?: number
      /** @deprecated Use cornerRadius instead. */
      cardRadius?: number
      /** Preload image sources and redraw as each image loads. Defaults to true. */
      preloadImages?: boolean
    }

/** @deprecated Use SpherCanvasImageSurfaceSpherOptions instead. */
export type SpherCanvasImageCardSpherOptions<TItem extends SpherCanvasItem = SpherCanvasItem> =
  SpherCanvasImageSurfaceSpherOptions<TItem>

export type SpherCanvasImageSurfaceInstance<TItem extends SpherCanvasItem = SpherCanvasItem> =
  SpherCanvasInstance<TItem> & {
    renderer: SpherCanvasPreloadableRenderer<TItem>
    preloadImages: (items?: TItem[], onLoad?: () => void) => void
  }

/** @deprecated Use SpherCanvasImageSurfaceInstance instead. */
export type SpherCanvasImageCardInstance<TItem extends SpherCanvasItem = SpherCanvasItem> =
  SpherCanvasImageSurfaceInstance<TItem>

type CachedImage = {
  image: HTMLImageElement
  src: string
}

export const createImageSurfaceRenderer = <TItem extends SpherCanvasItem>(
  options: SpherCanvasImageSurfaceRendererOptions<TItem>,
): SpherCanvasPreloadableRenderer<TItem> => {
  const images = createImageCache(options.image)
  const renderer = createSurfaceRenderer<TItem>({
    ...options,
    aspectRatio: options.imageAspectRatio,
    render: (context, item, _state, frame) => {
      const image = images.resolve(item)
      if (image?.complete && image.naturalWidth > 0) {
        drawCoverImage(context, image, frame.mediaX, frame.mediaY, frame)
        return
      }
      drawFallbackSurface(context, frame)
    },
    renderBack: (context, item, _state, frame) => {
      drawImageSurfaceBack(context, images.resolve(item), frame)
    },
  }) as SpherCanvasPreloadableRenderer<TItem>

  renderer.preload = images.preload
  return renderer
}

export const createImageSurfaceSpher = <TItem extends SpherCanvasItem>(
  canvas: HTMLCanvasElement,
  options: SpherCanvasImageSurfaceSpherOptions<TItem>,
): SpherCanvasImageSurfaceInstance<TItem> => {
  const { canvasOptions, preloadImages, rendererOptions } = splitImageSurfaceOptions(options)
  const renderer = createImageSurfaceRenderer<TItem>(rendererOptions)
  const instance = createSpherCanvas(canvas, { ...canvasOptions, render: renderer })
  const preload = (items = instance.getState().items, onLoad?: () => void) => {
    renderer.preload(items, onLoad ?? (() => instance.update({})))
  }
  const update: SpherCanvasInstance<TItem>["update"] = (patch) => {
    instance.update(patch)
    if (preloadImages && patch.items) preload(patch.items)
  }

  if (preloadImages) preload(canvasOptions.items)

  return {
    ...instance,
    renderer,
    preloadImages: preload,
    update,
  }
}

/** @deprecated Use createImageSurfaceRenderer instead. */
export const createImageCardRenderer = createImageSurfaceRenderer

/** @deprecated Use createImageSurfaceSpher instead. */
export const createImageCardSpher = createImageSurfaceSpher

const createImageCache = <TItem extends SpherCanvasItem>(
  getSource: (item: TItem) => SpherCanvasImageSource,
) => {
  const cache = new Map<string, CachedImage>()
  let notifyImageLoad: (() => void) | undefined

  const resolve = (item: TItem) => {
    const source = getSource(item)
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

  return {
    preload: (items: TItem[], onLoad?: () => void) => {
      notifyImageLoad = onLoad
      for (const item of items) resolve(item)
    },
    resolve,
  }
}

const splitImageSurfaceOptions = <TItem extends SpherCanvasItem>({
  cardRadius,
  colors,
  cornerRadius,
  fallbackColors,
  image,
  imageAspectRatio,
  inset,
  mediaRadius,
  preloadImages = true,
  tone,
  widthOffset,
  ...canvasOptions
}: SpherCanvasImageSurfaceSpherOptions<TItem>) => ({
  canvasOptions,
  preloadImages,
  rendererOptions: {
    colors,
    cornerRadius: cornerRadius ?? cardRadius,
    fallbackColors,
    image,
    imageAspectRatio,
    inset,
    mediaRadius,
    tone,
    widthOffset,
  },
})
