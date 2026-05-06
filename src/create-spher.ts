import { createCardRenderer } from "./canvas/card-renderer.js"
import { createCanvasSpher } from "./canvas/create-spher-canvas.js"
import type {
  SpherOptions as SpherCanvasOptions,
  SpherInstance,
  SpherItem,
} from "./canvas/types.js"

export type SpherOptions<TItem = SpherItem> = Omit<SpherCanvasOptions<TItem>, "render"> & {
  /** Shared drawing options for the default card renderer. */
  card?: {
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
  /** Low-level canvas renderer for custom item drawing. */
  render?: SpherCanvasOptions<TItem>["render"]
}

export const createSpher = <TItem>(
  canvas: HTMLCanvasElement,
  options: SpherOptions<TItem>,
): SpherInstance<TItem> => {
  const { card, render, ...canvasOptions } = options
  if (render) return createCanvasSpher(canvas, { ...canvasOptions, render })

  const cover = createCoverResolver<TItem>()
  let cardOptions = card
  let renderer = createCardPresetRenderer(cover, cardOptions)
  const instance = createCanvasSpher(canvas, { ...canvasOptions, render: renderer })
  const update: SpherInstance<TItem>["update"] = (patch) => {
    const {
      card: nextCard,
      render: nextRender,
      ...canvasPatch
    } = patch as Partial<SpherOptions<TItem>>
    if (nextRender) {
      instance.update({ ...canvasPatch, render: nextRender })
      return
    }
    if ("card" in patch) {
      cardOptions = nextCard
      renderer = createCardPresetRenderer(cover, cardOptions)
    }
    instance.update({ ...canvasPatch, render: renderer })
    if (canvasPatch.items) {
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
  cover: ReturnType<typeof createCoverResolver<TItem>>,
  card: SpherOptions<TItem>["card"],
) => {
  return createCardRenderer<TItem>({
    card,
    cover: (item) => cover.resolve(item),
  })
}

const createCoverResolver = <TItem>() => {
  const cache = new Map<string, { cover: HTMLImageElement; src: string }>()
  let notifyLoad: (() => void) | undefined

  const resolve = (item: TItem & SpherItem): CanvasImageSource | undefined => {
    const source = item.cover
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
