import { createSpher } from "./create-spher-canvas.js"
import type { SpherImageSource, SpherPreloadableRenderer } from "./renderer-types.js"
import {
  createSurfaceRenderer,
  drawCoverImage,
  drawFallbackSurface,
  drawImageSurfaceBack,
  type SpherSurfaceRendererOptions,
} from "./surface-renderer.js"
import type { SpherInstance, SpherItem, SpherOptions } from "./types.js"

export type SpherImageSurfaceRendererOptions<
  TItem extends SpherItem = SpherItem,
> = Omit<SpherSurfaceRendererOptions<TItem>, "aspectRatio" | "render" | "renderBack"> & {
  image: (item: TItem) => SpherImageSource
  imageAspectRatio?: number
}

export type SpherImageSurfaceSpherOptions<TItem extends SpherItem = SpherItem> =
  Omit<SpherOptions<TItem>, "render"> &
    Omit<SpherImageSurfaceRendererOptions<TItem>, "cornerRadius"> & {
      /** Corner radius for each rendered image surface. */
      cornerRadius?: number
      /** Preload image sources and redraw as each image loads. Defaults to true. */
      preloadImages?: boolean
    }

export type SpherImageSurfaceInstance<TItem extends SpherItem = SpherItem> =
  SpherInstance<TItem> & {
    renderer: SpherPreloadableRenderer<TItem>
    preloadImages: (items?: TItem[], onLoad?: () => void) => void
  }

type CachedImage = {
  image: HTMLImageElement
  src: string
}

export const createImageSurfaceRenderer = <TItem extends SpherItem>(
  options: SpherImageSurfaceRendererOptions<TItem>,
): SpherPreloadableRenderer<TItem> => {
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
  }) as SpherPreloadableRenderer<TItem>

  renderer.preload = images.preload
  return renderer
}

export const createImageSurfaceSpher = <TItem extends SpherItem>(
  canvas: HTMLCanvasElement,
  options: SpherImageSurfaceSpherOptions<TItem>,
): SpherImageSurfaceInstance<TItem> => {
  const { canvasOptions, preloadImages, rendererOptions } = splitImageSurfaceOptions(options)
  const renderer = createImageSurfaceRenderer<TItem>(rendererOptions)
  const instance = createSpher(canvas, { ...canvasOptions, render: renderer })
  const preload = (items = instance.getState().items, onLoad?: () => void) => {
    renderer.preload(items, onLoad ?? (() => instance.update({})))
  }
  const update: SpherInstance<TItem>["update"] = (patch) => {
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

const createImageCache = <TItem extends SpherItem>(
  getSource: (item: TItem) => SpherImageSource,
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

const splitImageSurfaceOptions = <TItem extends SpherItem>({
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
}: SpherImageSurfaceSpherOptions<TItem>) => ({
  canvasOptions,
  preloadImages,
  rendererOptions: {
    colors,
    cornerRadius,
    fallbackColors,
    image,
    imageAspectRatio,
    inset,
    mediaRadius,
    tone,
    widthOffset,
  },
})
