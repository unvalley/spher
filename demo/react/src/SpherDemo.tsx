import { useCallback, useEffect, useRef, useState } from "react"
import {
  createImageCardRenderer,
  createSpher,
  type SpherCanvasFaceMode,
  type SpherCanvasInstance,
  type SpherCanvasItem,
} from "../../../src/index.js"

type Item = SpherCanvasItem & {
  title: string
  year: number
  category: string
  image: string
}

const sourceItems: Item[] = [
  {
    id: "socrates",
    title: "Socrates",
    year: -470,
    category: "philosophy",
    image:
      "https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "alexandria",
    title: "Library of Alexandria",
    year: -283,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1519682577862-22b62b24e493?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "astrolabe",
    title: "Astrolabe",
    year: 150,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "printing",
    title: "Movable Type",
    year: 1040,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "observatory",
    title: "Observatory",
    year: 1577,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "web",
    title: "World Wide Web",
    year: 1989,
    category: "network",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "rosetta",
    title: "Rosetta Stone",
    year: -196,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1590086783191-a0694c7d1e6e?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "antikythera",
    title: "Antikythera",
    year: -87,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "silk-road",
    title: "Silk Road",
    year: 130,
    category: "network",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "hypatia",
    title: "Hypatia",
    year: 355,
    category: "philosophy",
    image:
      "https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "codex",
    title: "Codex",
    year: 400,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "compass",
    title: "Compass",
    year: 1044,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "telegraph",
    title: "Telegraph",
    year: 1844,
    category: "network",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "nietzsche",
    title: "Nietzsche",
    year: 1844,
    category: "philosophy",
    image:
      "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "phonograph",
    title: "Phonograph",
    year: 1877,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "radio",
    title: "Radio",
    year: 1895,
    category: "network",
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "enigma",
    title: "Enigma",
    year: 1918,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "turing",
    title: "Turing",
    year: 1912,
    category: "philosophy",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "magnetic-tape",
    title: "Magnetic Tape",
    year: 1928,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "satellite",
    title: "Satellite",
    year: 1957,
    category: "network",
    image:
      "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "microchip",
    title: "Microchip",
    year: 1959,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "internet",
    title: "ARPANET",
    year: 1969,
    category: "network",
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=420&q=80",
  },
  {
    id: "notebook",
    title: "Field Notes",
    year: 1986,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=420&q=80",
  },
]

const items: Item[] = Array.from({ length: 4 }, (_, pass) =>
  sourceItems.map((item, index) => ({
    ...item,
    id: `${item.id}-${pass}`,
    year: item.year + pass * 11 + index,
  })),
).flat()

export const SpherDemo = () => {
  const [selectedId, setSelectedId] = useState(items[0].id)
  const [cardSizeRatio, setCardSizeRatio] = useState(0.06)
  const [faceMode, setFaceMode] = useState<SpherCanvasFaceMode>("face-out")
  const [tiltPitch, setTiltPitch] = useState(12)
  const [tiltRoll, setTiltRoll] = useState(0)

  const visibleSelectedId = items.some((item) => item.id === selectedId) ? selectedId : null
  const handleSelect = useCallback((item: Item) => setSelectedId(item.id), [])

  return (
    <main className="archive-demo">
      <header className="archive-header">
        <div>
          <p className="archive-kicker">Spher canvas demo</p>
          <label className="archive-range-control">
            <span>Size ratio</span>
            <input
              aria-label="Card size ratio"
              max="0.12"
              min="0.03"
              onChange={(event) => setCardSizeRatio(Number(event.currentTarget.value))}
              step="0.01"
              type="range"
              value={cardSizeRatio}
            />
            <output>{Math.round(cardSizeRatio * 100)}%</output>
          </label>
          <label className="archive-range-control">
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
          <label className="archive-range-control">
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
          <fieldset aria-label="Card face mode" className="archive-face-control">
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
        </div>
      </header>

      <CanvasArchiveSphere
        cardSizeRatio={cardSizeRatio}
        faceMode={faceMode}
        onSelect={handleSelect}
        selectedId={visibleSelectedId}
        tiltPitch={tiltPitch}
        tiltRoll={tiltRoll}
      />
    </main>
  )
}

const CanvasArchiveSphere = ({
  cardSizeRatio,
  faceMode,
  onSelect,
  selectedId,
  tiltPitch,
  tiltRoll,
}: {
  cardSizeRatio: number
  faceMode: SpherCanvasFaceMode
  onSelect: (item: Item) => void
  selectedId: string | null
  tiltPitch: number
  tiltRoll: number
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const instanceRef = useRef<SpherCanvasInstance<Item> | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const renderer = createImageCardRenderer<Item>({
      colors: categoryColors,
      image: (item) => item.image,
      tone: (item) => item.category,
    })
    const instance = createSpher(canvasRef.current, {
      controls: { autoRotate: true, drag: true, keyboard: true, wheel: true },
      faceMode: "face-out",
      items,
      maxZoom: 4.4,
      minZoom: 0.66,
      onSelect,
      perspective: 980,
      radius: "auto",
      render: renderer,
      selectedId: null,
      size: { ratio: 0.06 },
    })
    instanceRef.current = instance
    renderer.preload(items, () => instance.update({}))

    return () => {
      instance.destroy()
      if (instanceRef.current === instance) instanceRef.current = null
    }
  }, [onSelect])

  useEffect(() => {
    instanceRef.current?.update({
      faceMode,
      selectedId,
      size: { ratio: cardSizeRatio },
      tilt: { x: tiltPitch, z: tiltRoll },
    })
  }, [cardSizeRatio, faceMode, selectedId, tiltPitch, tiltRoll])

  return (
    <canvas
      aria-label="Spher canvas demo"
      className="archive-sphere archive-canvas"
      ref={canvasRef}
    />
  )
}

const categoryColors: Record<string, [string, string]> = {
  archive: ["#dbeafe", "#60a5fa"],
  instrument: ["#dcfce7", "#34d399"],
  network: ["#fee2e2", "#fb7185"],
  philosophy: ["#f3e8ff", "#a78bfa"],
}
