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
  /** Resolved foreground and background colors for this item. */
  colors?: SpherColorPair
  /** Resolved cover source for this item. Strings are loaded as images. */
  cover?: SpherCoverSource
  /** Resolved secondary label drawn below the title. */
  subtitle?: SpherCardText
  /** Resolved primary label drawn on the card. */
  title?: SpherCardText
  /** Resolved color tone key used with `colors` records. */
  tone?: string | null | undefined
}

export type SpherCardOptions<TItem extends SpherItem = SpherItem> = Omit<
  SpherCardRendererOptions<TItem>,
  "aspectRatio" | "colors" | "render" | "renderBack" | "tone"
> & {
  /** Color palette keyed by tone, or a resolver that returns colors per item. */
  colors?: Record<string, SpherColorPair> | ((item: TItem) => SpherColorPair | null | undefined)
  /** Resolves the card cover source for an item. */
  cover?: (item: TItem) => SpherCoverSource
  /** Aspect ratio for the cover area. Defaults to 3 / 4. */
  coverAspectRatio?: number
  /** Preloads string cover sources. Defaults to true. */
  preloadCover?: boolean
  /** Custom drawing hook for the main card side, called after the default cover and text. */
  render?: SpherCardContent<TItem>
  /** Custom drawing hook for the back side. Defaults to a mirrored cover treatment. */
  renderBack?: SpherCardContent<TItem>
  /** Resolves the secondary label for an item. */
  subtitle?: (item: TItem) => SpherCardText
  /** Resolves the primary label for an item. */
  title?: (item: TItem) => SpherCardText
  /** Resolves the tone key used to pick colors from a `colors` record. */
  tone?: (item: TItem) => string | null | undefined
}

export type SpherCard<TItem extends SpherItem = SpherItem> = SpherCardOptions<TItem>

export type SpherOptions<TItem extends SpherItem = SpherItem> = SpherCanvasOptions<TItem> & {
  /** High-level card preset. When omitted, use the lower-level `render` callback. */
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
  const cover = createCoverResolver<TItem>((item) => cardOptions.cover?.(item))
  const renderer: SpherRenderer<TItem> = createCardPresetRenderer(() => cardOptions, cover)
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
      card.render?.(context, item, state, frame)
    },
    renderBack: (context, item, state, frame) => {
      const card = getCard()
      if (card.renderBack) {
        card.renderBack(context, item, state, frame)
        return
      }
      drawCardBack(context, cover.resolve(item), frame)
    },
  }
  const renderCard = createCardRenderer(cardRendererOptions)

  return (context, item, state) => {
    applyCardRendererOptions(cardRendererOptions, getCard())
    renderCard(context, item, state)
  }
}

const resolveCardRendererOptions = <TItem extends SpherItem>(
  card: SpherCard<TItem>,
): SpherCardRendererOptions<TItem> => {
  const { coverAspectRatio, render, renderBack, title, subtitle, preloadCover, ...options } = card
  return {
    ...options,
    aspectRatio: coverAspectRatio,
  }
}

const applyCardRendererOptions = <TItem extends SpherItem>(
  target: SpherCardRendererOptions<TItem>,
  card: SpherCard<TItem>,
) => {
  const next = resolveCardRendererOptions(card)
  target.aspectRatio = next.aspectRatio
  target.colors = next.colors
  target.cornerRadius = next.cornerRadius
  target.coverRadius = next.coverRadius
  target.fallbackColors = next.fallbackColors
  target.inset = next.inset
  target.tone = next.tone
  target.widthOffset = next.widthOffset
}

const resolveCardRecipe = <TItem extends SpherItem>(
  card: SpherCard<TItem>,
  item: TItem,
): SpherCardRecipe => {
  return {
    cover: card.cover?.(item),
    subtitle: card.subtitle?.(item),
    title: card.title?.(item),
    tone: card.tone?.(item),
  }
}

const createCoverResolver = <TItem extends SpherItem>(
  getCover: (item: TItem) => SpherCoverSource,
) => {
  const cache = new Map<string, { cover: HTMLImageElement; src: string }>()
  let notifyLoad: (() => void) | undefined

  const resolve = (item: TItem): CanvasImageSource | undefined => {
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
    preload: (items: TItem[], onLoad?: () => void) => {
      notifyLoad = onLoad
      for (const item of items) resolve(item)
    },
    resolve,
  }
}

const shouldPreloadCover = <TItem extends SpherItem>(card: SpherCard<TItem>) =>
  card.preloadCover !== false

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
