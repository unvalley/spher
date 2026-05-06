import { createCardRenderer } from "./canvas/card-renderer.js"
import { createCanvasSpher } from "./canvas/create-spher-canvas.js"
import type {
  SpherOptions as SpherCanvasOptions,
  SpherInstance,
  SpherItem,
} from "./canvas/types.js"

export type SpherCardStyle = {
  /** Outer card border color. */
  borderColor?: string
  /** Outer card border color when the back side is visible. */
  backBorderColor?: string
  /** Outer card border color for the selected item. */
  selectedBorderColor?: string
  /** Outer card border width in CSS pixels. */
  borderWidth?: number
  /** Outer card border width for the selected item in CSS pixels. */
  selectedBorderWidth?: number
}

export type SpherCardOptions<TItem = SpherItem> = {
  /** Resolves the card cover source for an item. */
  cover?: (item: TItem & SpherItem) => string | CanvasImageSource | null | undefined
  /** Visual overrides for the card frame. */
  style?: SpherCardStyle
}

export type SpherOptions<TItem = SpherItem> = Omit<SpherCanvasOptions<TItem>, "render"> &
  (
    | {
        /** High-level card preset for framed covers. */
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
  return createCardRenderer<TItem>({
    cover: (item) => cover.resolve(item),
    style: card.style,
  })
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
