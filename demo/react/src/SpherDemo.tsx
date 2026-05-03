import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react"
import {
  createImageSurfaceSpher,
  type SpherFaceMode,
  type SpherInstance,
  type SpherItem,
} from "../../../src/index.js"

type Item = SpherItem & {
  category: string
  image: string
  title: string
  year: number
}

type SourceItem = Omit<Item, "image">

const philosophyImages = [
  new URL("./assets/philosophy/abelard-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/abelard.jpg", import.meta.url).href,
  new URL("./assets/philosophy/adam-smith.jpg", import.meta.url).href,
  new URL("./assets/philosophy/adorno.jpg", import.meta.url).href,
  new URL("./assets/philosophy/ai-ethics.jpg", import.meta.url).href,
  new URL("./assets/philosophy/al-ghazali-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/al-kindi-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/al-kindi.png", import.meta.url).href,
  new URL("./assets/philosophy/alexandria-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/alexandria.jpg", import.meta.url).href,
  new URL("./assets/philosophy/analects-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/analects.jpg", import.meta.url).href,
  new URL("./assets/philosophy/aquinas-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/arendt-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/aristotle.jpg", import.meta.url).href,
  new URL("./assets/philosophy/ashoka.jpg", import.meta.url).href,
  new URL("./assets/philosophy/augustine.jpg", import.meta.url).href,
  new URL("./assets/philosophy/averroes.jpg", import.meta.url).href,
  new URL("./assets/philosophy/avicenna-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/bacon-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/bacon.jpg", import.meta.url).href,
  new URL("./assets/philosophy/bacon.png", import.meta.url).href,
  new URL("./assets/philosophy/beauvoir-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/beauvoir.png", import.meta.url).href,
  new URL("./assets/philosophy/being-and-time-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/benjamin-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/benjamin.jpg", import.meta.url).href,
  new URL("./assets/philosophy/bentham-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/bentham.jpg", import.meta.url).href,
  new URL("./assets/philosophy/boethius.jpg", import.meta.url).href,
  new URL("./assets/philosophy/buddha.png", import.meta.url).href,
  new URL("./assets/philosophy/butler-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/butler.jpg", import.meta.url).href,
  new URL("./assets/philosophy/camus-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/capital-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/comte-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/dai-zhen-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/daodejing.jpg", import.meta.url).href,
  new URL("./assets/philosophy/daodejing.png", import.meta.url).href,
  new URL("./assets/philosophy/darwin-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/death-of-socrates-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/death-of-socrates.jpg", import.meta.url).href,
  new URL("./assets/philosophy/declaration-rights-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/declaration-rights.jpg", import.meta.url).href,
  new URL("./assets/philosophy/derrida-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/derrida.jpg", import.meta.url).href,
  new URL("./assets/philosophy/dewey-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/dewey.jpg", import.meta.url).href,
  new URL("./assets/philosophy/diderot-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/diderot.jpg", import.meta.url).href,
  new URL("./assets/philosophy/diogenes-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/diogenes.jpg", import.meta.url).href,
  new URL("./assets/philosophy/dogen-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/dogen.jpg", import.meta.url).href,
  new URL("./assets/philosophy/du-bois-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/du-bois.jpg", import.meta.url).href,
  new URL("./assets/philosophy/duns-scotus-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/duns-scotus.jpg", import.meta.url).href,
  new URL("./assets/philosophy/encyclopedie-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/encyclopedie.jpg", import.meta.url).href,
  new URL("./assets/philosophy/epicurus.jpg", import.meta.url).href,
  new URL("./assets/philosophy/fanon-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/fanon.webp", import.meta.url).href,
  new URL("./assets/philosophy/foucault-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/foucault.jpg", import.meta.url).href,
  new URL("./assets/philosophy/four-books-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/frankfurt-school-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/frege-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/frege.jpg", import.meta.url).href,
  new URL("./assets/philosophy/french-revolution-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/french-revolution.jpg", import.meta.url).href,
  new URL("./assets/philosophy/fukuzawa-yukichi-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/fukuzawa-yukichi.jpg", import.meta.url).href,
  new URL("./assets/philosophy/galileo-trial.jpg", import.meta.url).href,
  new URL("./assets/philosophy/galileo-trial.png", import.meta.url).href,
  new URL("./assets/philosophy/great-wave-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/great-wave.jpg", import.meta.url).href,
  new URL("./assets/philosophy/guernica-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/habermas-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/habermas.jpg", import.meta.url).href,
  new URL("./assets/philosophy/han-feizi-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/han-feizi.png", import.meta.url).href,
  new URL("./assets/philosophy/hegel-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/hegel.jpg", import.meta.url).href,
  new URL("./assets/philosophy/heidegger-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/heraclitus-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/heraclitus.jpg", import.meta.url).href,
  new URL("./assets/philosophy/hildegard.jpg", import.meta.url).href,
  new URL("./assets/philosophy/hobbes-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/house-of-wisdom-photo.jpg", import.meta.url).href,
  new URL("./assets/philosophy/house-of-wisdom.jpg", import.meta.url).href,
  new URL("./assets/philosophy/huineng-photo.jpg", import.meta.url).href,
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
  const [faceMode, setFaceMode] = useState<SpherFaceMode>("face-out")
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
  faceMode: SpherFaceMode
  onSelect: (item: Item) => void
  selectedId: string | null
  surfaceSizeRatio: number
  tiltPitch: number
  tiltRoll: number
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const instanceRef = useRef<SpherInstance<Item> | null>(null)

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
  instance: SpherInstance<Item>,
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
