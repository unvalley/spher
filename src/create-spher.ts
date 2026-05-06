import {
  createCardRenderer,
  drawCardBack,
  drawCover,
  drawFallbackCard,
  isDrawableCover,
} from "./canvas/card-renderer.js"
import { createCanvasSpher } from "./canvas/create-spher-canvas.js"
import type {
  SpherOptions as SpherCanvasOptions,
  SpherCardRendererOptions,
  SpherInstance,
  SpherItem,
} from "./canvas/index.js"

export type SpherCardOptions<TItem = SpherItem> = Omit<
  SpherCardRendererOptions<TItem>,
  "aspectRatio" | "render" | "renderBack"
> & {
  /** Resolves the card cover source for an item. */
  cover?: (item: TItem & SpherItem) => string | CanvasImageSource | null | undefined
  /** Aspect ratio for the cover area. Defaults to 3 / 4. */
  coverAspectRatio?: number
}

export type SpherOptions<TItem = SpherItem> = Omit<SpherCanvasOptions<TItem>, "render"> &
  (
    | {
        /** High-level card preset for framed covers and labels. */
        card?: SpherCardOptions<TItem>
        render?: never
      }
    | {
        card?: never
        /** Low-level canvas renderer for custom item drawing. */
        render?: SpherCanvasOptions<TItem>["render"]
      }
  )

export const createSpher = <TItem>(
  canvas: HTMLCanvasElement,
  options: SpherOptions<TItem>,
): SpherInstance<TItem> => {
  const { card, ...canvasOptions } = options
  if (!card) return createCanvasSpher(canvas, canvasOptions)

  let cardOptions = card
  let cover = createCoverResolver<TItem>((item) => cardOptions.cover?.(item))
  let renderer = createCardPresetRenderer(cardOptions, cover)
  const instance = createCanvasSpher(canvas, { ...canvasOptions, render: renderer })
  const update: SpherInstance<TItem>["update"] = (patch) => {
    const { card: nextCard, ...canvasPatch } = patch as Partial<SpherOptions<TItem>>
    if (nextCard) {
      cardOptions = nextCard
      cover = createCoverResolver<TItem>((item) => cardOptions.cover?.(item))
      renderer = createCardPresetRenderer(cardOptions, cover)
    }
    instance.update({ ...canvasPatch, render: renderer })
    if (nextCard || canvasPatch.items) {
      cover.preload(instance.getState().items, () => instance.update({}))
    }
  }

  cover.preload(canvasOptions.items, () => instance.update({}))

  return {
    ...instance,
    update,
  }
}

const createCardPresetRenderer = <TItem>(
  card: SpherCardOptions<TItem>,
  cover: ReturnType<typeof createCoverResolver<TItem>>,
) => {
  const cardRendererOptions: SpherCardRendererOptions<TItem> = {
    aspectRatio: card.coverAspectRatio,
    cornerRadius: card.cornerRadius,
    coverRadius: card.coverRadius,
    inset: card.inset,
    render: (context, item, _state, frame) => {
      const source = cover.resolve(item)

      if (isDrawableCover(source)) {
        drawCover(context, source, frame.coverX, frame.coverY, frame)
      } else {
        drawFallbackCard(context, frame)
      }
    },
    renderBack: (context, item, _state, frame) => {
      drawCardBack(context, cover.resolve(item), frame)
    },
    style: card.style,
    widthOffset: card.widthOffset,
  }
  return createCardRenderer(cardRendererOptions)
}

const createCoverResolver = <TItem>(
  getCover: (item: TItem & SpherItem) => string | CanvasImageSource | null | undefined,
) => {
  const cache = new Map<string, { cover: HTMLImageElement; src: string }>()
  let notifyLoad: (() => void) | undefined

  const resolve = (item: TItem & SpherItem): CanvasImageSource | undefined => {
    const source = getCover(item)
    if (!source) return undefined
    if (typeof source !== "string") return source

    const cached = cache.get(item.id)
    if (cached?.src === source) return cached.cover

    const element = new Image()
    element.decoding = "async"
    element.onload = () => notifyLoad?.()
    element.src = source
    cache.set(item.id, { cover: element, src: source })
    return element
  }

  return {
    preload: (items: Array<TItem & SpherItem>, onLoad?: () => void) => {
      notifyLoad = onLoad
      for (const item of items) resolve(item)
    },
    resolve,
  }
}
