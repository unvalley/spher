import { useCallback, useEffect, useState } from "react"
import type { SpherFaceMode, SpherItem } from "../../../src/index.js"
import { Spher } from "../../../src/react/index.js"

type Item = SpherItem & {
  category: string
  cover: string
  title: string
}

type ItemSeed = {
  category: string
  coverFiles: string[]
  id: string
  title: string
}

const philosophyCovers = import.meta.glob<string>("./assets/philosophy/*", {
  eager: true,
  import: "default",
  query: "?url",
})

const coverUrl = (filename: string) => {
  const cover = philosophyCovers[`./assets/philosophy/${filename}`]
  if (!cover) {
    throw new Error(`Missing philosophy cover: ${filename}`)
  }
  return cover
}

const itemSeeds: ItemSeed[] = [
  {
    id: "socrates",
    title: "Socrates",
    category: "philosophy",
    coverFiles: [
      "abelard-photo.jpg",
      "beauvoir.png",
      "dewey-photo.jpg",
      "french-revolution-photo.jpg",
    ],
  },
  {
    id: "alexandria",
    title: "Library of Alexandria",
    category: "archive",
    coverFiles: ["abelard.jpg", "being-and-time-photo.jpg", "dewey.jpg", "french-revolution.jpg"],
  },
  {
    id: "astrolabe",
    title: "Astrolabe",
    category: "instrument",
    coverFiles: [
      "adam-smith.jpg",
      "benjamin-photo.jpg",
      "diderot-photo.jpg",
      "fukuzawa-yukichi-photo.jpg",
    ],
  },
  {
    id: "printing",
    title: "Movable Type",
    category: "archive",
    coverFiles: ["adorno.jpg", "benjamin.jpg", "diderot.jpg", "fukuzawa-yukichi.jpg"],
  },
  {
    id: "observatory",
    title: "Observatory",
    category: "instrument",
    coverFiles: ["ai-ethics.jpg", "bentham-photo.jpg", "diogenes-photo.jpg", "galileo-trial.jpg"],
  },
  {
    id: "web",
    title: "World Wide Web",
    category: "network",
    coverFiles: ["al-ghazali-photo.jpg", "bentham.jpg", "diogenes.jpg", "galileo-trial.png"],
  },
  {
    id: "rosetta",
    title: "Rosetta Stone",
    category: "archive",
    coverFiles: ["al-kindi-photo.jpg", "boethius.jpg", "dogen-photo.jpg", "great-wave-photo.jpg"],
  },
  {
    id: "antikythera",
    title: "Antikythera",
    category: "instrument",
    coverFiles: ["al-kindi.png", "buddha.png", "dogen.jpg", "great-wave.jpg"],
  },
  {
    id: "silk-road",
    title: "Silk Road",
    category: "network",
    coverFiles: [
      "alexandria-photo.jpg",
      "butler-photo.jpg",
      "du-bois-photo.jpg",
      "guernica-photo.jpg",
    ],
  },
  {
    id: "hypatia",
    title: "Hypatia",
    category: "philosophy",
    coverFiles: ["alexandria.jpg", "butler.jpg", "du-bois.jpg", "habermas-photo.jpg"],
  },
  {
    id: "codex",
    title: "Codex",
    category: "archive",
    coverFiles: ["analects-photo.jpg", "camus-photo.jpg", "duns-scotus-photo.jpg", "habermas.jpg"],
  },
  {
    id: "compass",
    title: "Compass",
    category: "instrument",
    coverFiles: ["analects.jpg", "capital-photo.jpg", "duns-scotus.jpg", "han-feizi-photo.jpg"],
  },
  {
    id: "telegraph",
    title: "Telegraph",
    category: "network",
    coverFiles: ["aquinas-photo.jpg", "comte-photo.jpg", "encyclopedie-photo.jpg", "han-feizi.png"],
  },
  {
    id: "nietzsche",
    title: "Nietzsche",
    category: "philosophy",
    coverFiles: ["arendt-photo.jpg", "dai-zhen-photo.jpg", "encyclopedie.jpg", "hegel-photo.jpg"],
  },
  {
    id: "phonograph",
    title: "Phonograph",
    category: "archive",
    coverFiles: ["aristotle.jpg", "daodejing.jpg", "epicurus.jpg", "hegel.jpg"],
  },
  {
    id: "radio",
    title: "Radio",
    category: "network",
    coverFiles: ["ashoka.jpg", "daodejing.png", "fanon-photo.jpg", "heidegger-photo.jpg"],
  },
  {
    id: "enigma",
    title: "Enigma",
    category: "instrument",
    coverFiles: ["augustine.jpg", "darwin-photo.jpg", "fanon.webp", "heraclitus-photo.jpg"],
  },
  {
    id: "turing",
    title: "Turing",
    category: "philosophy",
    coverFiles: [
      "averroes.jpg",
      "death-of-socrates-photo.jpg",
      "foucault-photo.jpg",
      "heraclitus.jpg",
    ],
  },
  {
    id: "magnetic-tape",
    title: "Magnetic Tape",
    category: "archive",
    coverFiles: ["avicenna-photo.jpg", "death-of-socrates.jpg", "foucault.jpg", "hildegard.jpg"],
  },
  {
    id: "satellite",
    title: "Satellite",
    category: "network",
    coverFiles: [
      "bacon-photo.jpg",
      "declaration-rights-photo.jpg",
      "four-books-photo.jpg",
      "hobbes-photo.jpg",
    ],
  },
  {
    id: "microchip",
    title: "Microchip",
    category: "instrument",
    coverFiles: [
      "bacon.jpg",
      "declaration-rights.jpg",
      "frankfurt-school-photo.jpg",
      "house-of-wisdom-photo.jpg",
    ],
  },
  {
    id: "internet",
    title: "ARPANET",
    category: "network",
    coverFiles: ["bacon.png", "derrida-photo.jpg", "frege-photo.jpg", "house-of-wisdom.jpg"],
  },
  {
    id: "notebook",
    title: "Field Notes",
    category: "archive",
    coverFiles: ["beauvoir-photo.jpg", "derrida.jpg", "frege.jpg", "huineng-photo.jpg"],
  },
]

const items: Item[] = itemSeeds.flatMap(({ coverFiles, ...item }) =>
  coverFiles.map((cover, index) => ({
    ...item,
    id: `${item.id}-${index}`,
    cover: coverUrl(cover),
  })),
)

const defaultCardSizeRatio = 0.06
const defaultTiltPitch = 12
const defaultTiltRoll = 0

export const SpherDemo = () => {
  const [selectedId, setSelectedId] = useState(items[0].id)
  const [cardSizeRatio, setCardSizeRatio] = useState(defaultCardSizeRatio)
  const [faceMode, setFaceMode] = useState<SpherFaceMode>("face-out")
  const [tiltPitch, setTiltPitch] = useState(defaultTiltPitch)
  const [tiltRoll, setTiltRoll] = useState(defaultTiltRoll)
  const [controlsVisible, setControlsVisible] = useState(true)

  const visibleSelectedId = items.some((item) => item.id === selectedId) ? selectedId : null
  const handleSelect = useCallback((item: Item) => setSelectedId(item.id), [])
  const handleResetView = useCallback(() => {
    setCardSizeRatio(defaultCardSizeRatio)
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
            <p className="demo-kicker">Spher demo</p>
            <label className="demo-range-control">
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
              <fieldset aria-label="Card face mode" className="demo-face-control">
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

      <Spher
        aria-label="Spher demo"
        card={{
          cover: (item) => item.cover,
          title: (item) => item.title,
          tone: (item) => item.category,
        }}
        className="sphere-canvas"
        controls={{ autoRotate: true, drag: true, keyboard: true, wheel: true }}
        faceMode={faceMode}
        items={items}
        onItemSelect={handleSelect}
        perspective={980}
        radius="auto"
        selectedId={visibleSelectedId}
        size={{ ratio: cardSizeRatio }}
        tilt={{ x: tiltPitch, z: tiltRoll }}
        zoom={{ min: 0.66, max: 4.4 }}
      />
    </main>
  )
}
