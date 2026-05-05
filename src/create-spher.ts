import {
  createSpher as createCanvasSpher,
  createCardRenderer,
  drawCardBack,
  drawCover,
  drawFallbackCard,
  isDrawableCover,
  type SpherOptions as SpherCanvasOptions,
  type SpherCardContent,
  type SpherCardFrame,
  type SpherCardRendererOptions,
  type SpherColorPair,
  type SpherCoverSource,
  type SpherInstance,
  type SpherItem,
  type SpherRenderer,
  type SpherRenderState,
} from "./canvas/index.js"

type SpherCardText = string | number | null | undefined

export type SpherCardRecipe = {
  colors?: SpherColorPair
  cover?: SpherCoverSource
  subtitle?: SpherCardText
  title?: SpherCardText
  tone?: string | null | undefined
}

export type SpherCardOptions<TItem extends SpherItem = SpherItem> = Omit<
  SpherCardRendererOptions<TItem>,
  "aspectRatio" | "colors" | "render" | "renderBack" | "tone"
> & {
  colors?: Record<string, SpherColorPair> | ((item: TItem) => SpherColorPair | null | undefined)
  cover?: (item: TItem) => SpherCoverSource
  coverAspectRatio?: number
  preloadCover?: boolean
  render?: SpherCardContent<TItem>
  renderBack?: SpherCardContent<TItem>
  subtitle?: (item: TItem) => SpherCardText
  title?: (item: TItem) => SpherCardText
  tone?: (item: TItem) => string | null | undefined
}

export type SpherCard<TItem extends SpherItem = SpherItem> =
  | SpherCardOptions<TItem>
  | ((item: TItem) => SpherCardRecipe)

export type SpherOptions<TItem extends SpherItem = SpherItem> = SpherCanvasOptions<TItem> & {
  card?: SpherCard<TItem>
}

type SpherInstanceWithRenderer<TItem extends SpherItem> = SpherInstance<TItem> & {
  renderer?: SpherRenderer<TItem>
}

export const createSpher = <TItem extends SpherItem>(
  canvas: HTMLCanvasElement,
  options: SpherOptions<TItem>,
): SpherInstanceWithRenderer<TItem> => {
  const { card, ...canvasOptions } = options
  if (!card) return createCanvasSpher(canvas, canvasOptions)

  let cardOptions = card
  const cover = createCoverResolver(() => cardOptions)
  const renderer = createCardPresetRenderer(() => cardOptions, cover)
  const instance = createCanvasSpher(canvas, { ...canvasOptions, render: renderer })
  const update: SpherInstance<TItem>["update"] = (patch) => {
    const { card: nextCard, ...canvasPatch } = patch as Partial<SpherOptions<TItem>>
    if (nextCard) cardOptions = nextCard
    instance.update({ ...canvasPatch, render: renderer })
    if (nextCard || canvasPatch.items) {
      cover.preload(instance.getState().items, () => instance.update({}))
    }
  }

  if (shouldPreloadCover(cardOptions)) {
    cover.preload(canvasOptions.items, () => instance.update({}))
  }

  return {
    ...instance,
    renderer,
    update,
  }
}

const createCardPresetRenderer = <TItem extends SpherItem>(
  getCard: () => SpherCard<TItem>,
  cover: ReturnType<typeof createCoverResolver<TItem>>,
): SpherRenderer<TItem> => {
  const cardRendererOptions: SpherCardRendererOptions<TItem> = {
    render: (context, item, state, frame) => {
      const card = getCard()
      const recipe = resolveCardRecipe(card, item)
      const source = cover.resolve(item)

      if (isDrawableCover(source)) {
        drawCover(context, source, frame.coverX, frame.coverY, frame)
      } else {
        drawFallbackCard(context, frame)
      }

      drawRecipeText(context, recipe, frame, state)
      if (typeof card !== "function") card.render?.(context, item, state, frame)
    },
    renderBack: (context, item, state, frame) => {
      const card = getCard()
      if (typeof card !== "function" && card.renderBack) {
        card.renderBack(context, item, state, frame)
        return
      }
      drawCardBack(context, cover.resolve(item), frame)
    },
  }

  return (context, item, state) => {
    const card = getCard()
    Object.assign(cardRendererOptions, resolveCardRendererOptions(card))
    createCardRenderer(cardRendererOptions)(context, item, state)
  }
}

const resolveCardRendererOptions = <TItem extends SpherItem>(
  card: SpherCard<TItem>,
): SpherCardRendererOptions<TItem> => {
  if (typeof card === "function") {
    return {
      colors: (item) => card(item).colors,
      tone: (item) => card(item).tone,
    }
  }

  const { coverAspectRatio, render, renderBack, title, subtitle, preloadCover, ...options } = card
  return {
    ...options,
    aspectRatio: coverAspectRatio,
  }
}

const resolveCardRecipe = <TItem extends SpherItem>(
  card: SpherCard<TItem>,
  item: TItem,
): SpherCardRecipe => {
  if (typeof card === "function") return card(item)
  return {
    cover: card.cover?.(item),
    subtitle: card.subtitle?.(item),
    title: card.title?.(item),
    tone: card.tone?.(item),
  }
}

const createCoverResolver = <TItem extends SpherItem>(getCard: () => SpherCard<TItem>) => {
  const cache = new Map<string, { cover: HTMLImageElement; src: string }>()
  let notifyLoad: (() => void) | undefined

  const resolve = (item: TItem): CanvasImageSource | undefined => {
    const source = resolveCardRecipe(getCard(), item).cover
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
    preload: (items: TItem[], onLoad?: () => void) => {
      notifyLoad = onLoad
      for (const item of items) resolve(item)
    },
    resolve,
  }
}

const shouldPreloadCover = <TItem extends SpherItem>(card: SpherCard<TItem>) =>
  typeof card === "function" || card.preloadCover !== false

const drawRecipeText = <TItem extends SpherItem>(
  context: CanvasRenderingContext2D,
  { subtitle, title }: SpherCardRecipe,
  frame: SpherCardFrame,
  state: SpherRenderState<TItem>,
) => {
  if (title == null && subtitle == null) return

  const titleText = title == null ? "" : String(title)
  const subtitleText = subtitle == null ? "" : String(subtitle)
  const centerY = frame.coverY + frame.coverHeight / 2

  context.save()
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.shadowBlur = 10
  context.shadowColor = "rgba(15, 23, 42, 0.48)"
  context.fillStyle = state.selected ? "#ffffff" : "rgba(255, 255, 255, 0.92)"

  if (titleText) {
    context.font = `600 ${Math.max(9, Math.min(13, frame.coverHeight * 0.16))}px system-ui`
    context.fillText(titleText, 0, subtitleText ? centerY - 5 : centerY, frame.coverWidth - 8)
  }

  if (subtitleText) {
    context.font = `500 ${Math.max(8, Math.min(11, frame.coverHeight * 0.13))}px system-ui`
    context.fillText(subtitleText, 0, titleText ? centerY + 8 : centerY, frame.coverWidth - 8)
  }

  context.restore()
}
