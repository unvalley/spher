import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react"
import {
  createImageSurfaceSpher,
  type SpherCanvasFaceMode,
  type SpherCanvasInstance,
  type SpherCanvasItem,
} from "../../../src/index.js"

type Item = SpherCanvasItem & {
  category: string
  image: string
  title: string
  year: number
}

type SourceItem = Omit<Item, "image">

const philosophyImages = [
  new URL("../../../research/image/philosophy/archive/items/abelard-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/abelard.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/adam-smith.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/adorno.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/ai-ethics.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/al-ghazali-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/al-kindi-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/al-kindi.png", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/alexandria-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/alexandria.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/analects-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/analects.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/aquinas-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/arendt-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/aristotle.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/ashoka.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/augustine.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/averroes.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/avicenna-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/bacon-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/bacon.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/bacon.png", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/beauvoir-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/beauvoir.png", import.meta.url).href,
  new URL(
    "../../../research/image/philosophy/archive/items/being-and-time-photo.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/benjamin-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/benjamin.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/bentham-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/bentham.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/boethius.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/buddha.png", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/butler-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/butler.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/camus-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/capital-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/comte-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/dai-zhen-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/daodejing.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/daodejing.png", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/darwin-photo.jpg", import.meta.url)
    .href,
  new URL(
    "../../../research/image/philosophy/archive/items/death-of-socrates-photo.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/death-of-socrates.jpg", import.meta.url)
    .href,
  new URL(
    "../../../research/image/philosophy/archive/items/declaration-rights-photo.jpg",
    import.meta.url,
  ).href,
  new URL(
    "../../../research/image/philosophy/archive/items/declaration-rights.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/derrida-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/derrida.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/dewey-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/dewey.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/diderot-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/diderot.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/diogenes-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/diogenes.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/dogen-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/dogen.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/du-bois-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/du-bois.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/duns-scotus-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/duns-scotus.jpg", import.meta.url).href,
  new URL(
    "../../../research/image/philosophy/archive/items/encyclopedie-photo.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/encyclopedie.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/epicurus.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/fanon-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/fanon.webp", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/foucault-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/foucault.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/four-books-photo.jpg", import.meta.url)
    .href,
  new URL(
    "../../../research/image/philosophy/archive/items/frankfurt-school-photo.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/frege-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/frege.jpg", import.meta.url).href,
  new URL(
    "../../../research/image/philosophy/archive/items/french-revolution-photo.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/french-revolution.jpg", import.meta.url)
    .href,
  new URL(
    "../../../research/image/philosophy/archive/items/fukuzawa-yukichi-photo.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/fukuzawa-yukichi.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/galileo-trial.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/galileo-trial.png", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/great-wave-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/great-wave.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/guernica-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/habermas-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/habermas.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/han-feizi-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/han-feizi.png", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/hegel-photo.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/hegel.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/heidegger-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/heraclitus-photo.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/heraclitus.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/hildegard.jpg", import.meta.url).href,
  new URL("../../../research/image/philosophy/archive/items/hobbes-photo.jpg", import.meta.url)
    .href,
  new URL(
    "../../../research/image/philosophy/archive/items/house-of-wisdom-photo.jpg",
    import.meta.url,
  ).href,
  new URL("../../../research/image/philosophy/archive/items/house-of-wisdom.jpg", import.meta.url)
    .href,
  new URL("../../../research/image/philosophy/archive/items/huineng-photo.jpg", import.meta.url)
    .href,
]

const sourceItems: SourceItem[] = [
  {
    id: "socrates",
    title: "Socrates",
    year: -470,
    category: "philosophy",
  },
  {
    id: "alexandria",
    title: "Library of Alexandria",
    year: -283,
    category: "archive",
  },
  {
    id: "astrolabe",
    title: "Astrolabe",
    year: 150,
    category: "instrument",
  },
  {
    id: "printing",
    title: "Movable Type",
    year: 1040,
    category: "archive",
  },
  {
    id: "observatory",
    title: "Observatory",
    year: 1577,
    category: "instrument",
  },
  {
    id: "web",
    title: "World Wide Web",
    year: 1989,
    category: "network",
  },
  {
    id: "rosetta",
    title: "Rosetta Stone",
    year: -196,
    category: "archive",
  },
  {
    id: "antikythera",
    title: "Antikythera",
    year: -87,
    category: "instrument",
  },
  {
    id: "silk-road",
    title: "Silk Road",
    year: 130,
    category: "network",
  },
  {
    id: "hypatia",
    title: "Hypatia",
    year: 355,
    category: "philosophy",
  },
  {
    id: "codex",
    title: "Codex",
    year: 400,
    category: "archive",
  },
  {
    id: "compass",
    title: "Compass",
    year: 1044,
    category: "instrument",
  },
  {
    id: "telegraph",
    title: "Telegraph",
    year: 1844,
    category: "network",
  },
  {
    id: "nietzsche",
    title: "Nietzsche",
    year: 1844,
    category: "philosophy",
  },
  {
    id: "phonograph",
    title: "Phonograph",
    year: 1877,
    category: "archive",
  },
  {
    id: "radio",
    title: "Radio",
    year: 1895,
    category: "network",
  },
  {
    id: "enigma",
    title: "Enigma",
    year: 1918,
    category: "instrument",
  },
  {
    id: "turing",
    title: "Turing",
    year: 1912,
    category: "philosophy",
  },
  {
    id: "magnetic-tape",
    title: "Magnetic Tape",
    year: 1928,
    category: "archive",
  },
  {
    id: "satellite",
    title: "Satellite",
    year: 1957,
    category: "network",
  },
  {
    id: "microchip",
    title: "Microchip",
    year: 1959,
    category: "instrument",
  },
  {
    id: "internet",
    title: "ARPANET",
    year: 1969,
    category: "network",
  },
  {
    id: "notebook",
    title: "Field Notes",
    year: 1986,
    category: "archive",
  },
]

const items: Item[] = Array.from({ length: 4 }, (_, pass) =>
  sourceItems.map((item, index) => ({
    ...item,
    id: `${item.id}-${pass}`,
    image: philosophyImages[pass * sourceItems.length + index],
    year: item.year + pass * 11 + index,
  })),
).flat()

const categoryColors: Record<string, [string, string]> = {
  archive: ["#dbeafe", "#60a5fa"],
  instrument: ["#dcfce7", "#34d399"],
  network: ["#fee2e2", "#fb7185"],
  philosophy: ["#f3e8ff", "#a78bfa"],
}

const defaultSurfaceSizeRatio = 0.06
const defaultTiltPitch = 12
const defaultTiltRoll = 0

export const SpherDemo = () => {
  const [selectedId, setSelectedId] = useState(items[0].id)
  const [surfaceSizeRatio, setSurfaceSizeRatio] = useState(defaultSurfaceSizeRatio)
  const [faceMode, setFaceMode] = useState<SpherCanvasFaceMode>("face-out")
  const [tiltPitch, setTiltPitch] = useState(defaultTiltPitch)
  const [tiltRoll, setTiltRoll] = useState(defaultTiltRoll)
  const [controlsVisible, setControlsVisible] = useState(true)

  const visibleSelectedId = items.some((item) => item.id === selectedId) ? selectedId : null
  const handleSelect = useCallback((item: Item) => setSelectedId(item.id), [])
  const handleResetView = useCallback(() => {
    setSurfaceSizeRatio(defaultSurfaceSizeRatio)
    setTiltPitch(defaultTiltPitch)
    setTiltRoll(defaultTiltRoll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "h") {
        setControlsVisible((visible) => !visible)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <main className="demo">
      {controlsVisible ? (
        <header className="demo-header">
          <div>
            <p className="demo-kicker">Spher canvas demo</p>
            <label className="demo-range-control">
              <span>Size ratio</span>
              <input
                aria-label="Surface size ratio"
                max="0.12"
                min="0.03"
                onChange={(event) => setSurfaceSizeRatio(Number(event.currentTarget.value))}
                step="0.01"
                type="range"
                value={surfaceSizeRatio}
              />
              <output>{Math.round(surfaceSizeRatio * 100)}%</output>
            </label>
            <label className="demo-range-control">
              <span>Pitch</span>
              <input
                aria-label="Sphere pitch"
                max="36"
                min="-36"
                onChange={(event) => setTiltPitch(Number(event.currentTarget.value))}
                step="1"
                type="range"
                value={tiltPitch}
              />
              <output>{tiltPitch}deg</output>
            </label>
            <label className="demo-range-control">
              <span>Roll</span>
              <input
                aria-label="Sphere roll"
                max="30"
                min="-30"
                onChange={(event) => setTiltRoll(Number(event.currentTarget.value))}
                step="1"
                type="range"
                value={tiltRoll}
              />
              <output>{tiltRoll}deg</output>
            </label>
            <div className="demo-control-row">
              <fieldset aria-label="Surface face mode" className="demo-face-control">
                <button
                  data-active={faceMode === "face-out"}
                  onClick={() => setFaceMode("face-out")}
                  type="button"
                >
                  Face out
                </button>
                <button
                  data-active={faceMode === "face-in"}
                  onClick={() => setFaceMode("face-in")}
                  type="button"
                >
                  Face in
                </button>
              </fieldset>
              <button className="demo-control-button" onClick={handleResetView} type="button">
                Reset
              </button>
              <button
                className="demo-control-button"
                onClick={() => setControlsVisible(false)}
                type="button"
              >
                Hide
              </button>
            </div>
          </div>
        </header>
      ) : null}

      <CanvasSphere
        faceMode={faceMode}
        onSelect={handleSelect}
        selectedId={visibleSelectedId}
        surfaceSizeRatio={surfaceSizeRatio}
        tiltPitch={tiltPitch}
        tiltRoll={tiltRoll}
      />
    </main>
  )
}

const CanvasSphere = ({
  faceMode,
  onSelect,
  selectedId,
  surfaceSizeRatio,
  tiltPitch,
  tiltRoll,
}: {
  faceMode: SpherCanvasFaceMode
  onSelect: (item: Item) => void
  selectedId: string | null
  surfaceSizeRatio: number
  tiltPitch: number
  tiltRoll: number
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const instanceRef = useRef<SpherCanvasInstance<Item> | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const instance = createImageSurfaceSpher(canvasRef.current, {
      colors: categoryColors,
      controls: { autoRotate: true, drag: true, keyboard: true, wheel: true },
      faceMode: "face-out",
      image: (item) => item.image,
      items,
      maxZoom: 4.4,
      minZoom: 0.66,
      onSelect,
      perspective: 980,
      radius: "auto",
      selectedId: null,
      size: { ratio: 0.06 },
      tone: (item) => item.category,
    })
    instanceRef.current = instance
    syncCanvasCursor(canvasRef.current, instance)

    return () => {
      instance.destroy()
      if (instanceRef.current === instance) instanceRef.current = null
    }
  }, [onSelect])

  useEffect(() => {
    instanceRef.current?.update({
      faceMode,
      selectedId,
      size: { ratio: surfaceSizeRatio },
      tilt: { x: tiltPitch, z: tiltRoll },
    })
  }, [faceMode, selectedId, surfaceSizeRatio, tiltPitch, tiltRoll])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const instance = instanceRef.current
    if (instance) syncCanvasCursor(event.currentTarget, instance, event.clientX, event.clientY)
  }, [])
  const handlePointerLeave = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.dataset.overSphere = "false"
    event.currentTarget.dataset.draggingSphere = "false"
  }, [])
  const handlePointerDown = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.dataset.overSphere === "true") {
      event.currentTarget.dataset.draggingSphere = "true"
    }
  }, [])
  const handlePointerUp = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.dataset.draggingSphere = "false"
  }, [])

  return (
    <canvas
      aria-label="Spher canvas demo"
      className="sphere-canvas"
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={canvasRef}
    />
  )
}

const syncCanvasCursor = (
  canvas: HTMLCanvasElement,
  instance: SpherCanvasInstance<Item>,
  clientX = -1,
  clientY = -1,
) => {
  const rect = canvas.getBoundingClientRect()
  const state = instance.getState()
  const x = clientX - rect.left - rect.width / 2
  const y = clientY - rect.top - rect.height / 2
  const radius = state.radius * state.sceneZoom
  canvas.dataset.overSphere = Math.hypot(x, y) <= radius ? "true" : "false"
}
