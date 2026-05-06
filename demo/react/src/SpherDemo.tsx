import { useEffect, useState } from "react"
import type { SpherFaceMode } from "../../../src/index.js"
import { Spher } from "../../../src/react/index.js"
import { items } from "./data.js"

const CARD_SIZE_RATIO = 0.06
const TILT_PITCH = 12
const TILT_ROLL = 0

export const SpherDemo = () => {
  const [selectedId, setSelectedId] = useState(items[0].id)
  const [cardSizeRatio, setCardSizeRatio] = useState(CARD_SIZE_RATIO)
  const [faceMode, setFaceMode] = useState<SpherFaceMode>("face-out")
  const [tiltPitch, setTiltPitch] = useState(TILT_PITCH)
  const [tiltRoll, setTiltRoll] = useState(TILT_ROLL)
  const [controlsVisible, setControlsVisible] = useState(true)

  const visibleSelectedId = items.some((item) => item.id === selectedId) ? selectedId : null
  const resetView = () => {
    setCardSizeRatio(CARD_SIZE_RATIO)
    setTiltPitch(TILT_PITCH)
    setTiltRoll(TILT_ROLL)
  }

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
              <button className="demo-control-button" onClick={resetView} type="button">
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
        onItemSelect={(item) => setSelectedId(item.id)}
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
