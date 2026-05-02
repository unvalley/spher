import { useCallback, useEffect, useRef, useState } from "react"
import {
  createSpher,
  type SpherCanvasInstance,
  type SpherCanvasItem,
  type SpherCanvasRenderState,
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
  const radius = useSphereRadius()

  const visibleSelectedId = items.some((item) => item.id === selectedId) ? selectedId : null
  const handleSelect = useCallback((item: Item) => setSelectedId(item.id), [])

  return (
    <main className="archive-demo">
      <header className="archive-header">
        <div>
          <p className="archive-kicker">Spher canvas demo</p>
        </div>
      </header>

      <CanvasArchiveSphere onSelect={handleSelect} radius={radius} selectedId={visibleSelectedId} />
    </main>
  )
}

const CanvasArchiveSphere = ({
  onSelect,
  radius,
  selectedId,
}: {
  onSelect: (item: Item) => void
  radius: number
  selectedId: string | null
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const instanceRef = useRef<SpherCanvasInstance<Item> | null>(null)
  const imagesRef = useRef(new Map<string, HTMLImageElement>())

  useEffect(() => {
    let active = true

    for (const item of items) {
      if (imagesRef.current.has(item.id)) continue

      const image = new Image()
      image.decoding = "async"
      image.onload = () => {
        if (active) instanceRef.current?.update({})
      }
      image.src = item.image
      imagesRef.current.set(item.id, image)
    }

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const instance = createSpher(canvasRef.current, {
      controls: { autoRotate: true, drag: true, keyboard: true, wheel: true },
      items,
      maxZoom: 4.4,
      minZoom: 0.66,
      onSelect,
      perspective: 980,
      radius: 280,
      render: (context, item, state) =>
        renderCanvasArchiveCard(context, item, state, imagesRef.current),
      selectedId: null,
      size: 52,
    })
    instanceRef.current = instance

    return () => {
      instance.destroy()
      if (instanceRef.current === instance) instanceRef.current = null
    }
  }, [onSelect])

  useEffect(() => {
    instanceRef.current?.update({ radius, selectedId })
  }, [radius, selectedId])

  return (
    <canvas
      aria-label="Spher canvas demo"
      className="archive-sphere archive-canvas"
      ref={canvasRef}
    />
  )
}

const useSphereRadius = () => {
  const [radius, setRadius] = useState(280)

  useEffect(() => {
    const updateRadius = () => {
      setRadius(
        Math.min(360, Math.max(180, Math.min(window.innerWidth * 0.3, window.innerHeight * 0.4))),
      )
    }

    updateRadius()
    window.addEventListener("resize", updateRadius)
    return () => window.removeEventListener("resize", updateRadius)
  }, [])

  return radius
}

const categoryColors: Record<string, [string, string]> = {
  archive: ["#dbeafe", "#60a5fa"],
  instrument: ["#dcfce7", "#34d399"],
  network: ["#fee2e2", "#fb7185"],
  philosophy: ["#f3e8ff", "#a78bfa"],
}

const renderCanvasArchiveCard = (
  context: CanvasRenderingContext2D,
  item: Item,
  state: SpherCanvasRenderState<Item>,
  images: Map<string, HTMLImageElement>,
) => {
  const width = state.item.size + 4
  const inset = 3
  const mediaWidth = width - inset * 2
  const mediaHeight = (mediaWidth * 4) / 3
  const height = mediaHeight + inset * 2
  const x = -width / 2
  const y = -height / 2
  const image = images.get(item.id)
  const colors = categoryColors[item.category] ?? ["#e5e7eb", "#94a3b8"]

  context.save()
  if (state.selected) {
    context.shadowBlur = 18
    context.shadowColor = "rgba(15, 23, 42, 0.24)"
  }

  context.fillStyle = "rgba(255, 255, 255, 0.86)"
  context.strokeStyle = state.selected ? "rgba(17, 24, 39, 0.96)" : "rgba(15, 23, 42, 0.16)"
  context.lineWidth = state.selected ? 2 : 1
  roundedRect(context, x, y, width, height, 4)
  context.fill()
  context.stroke()

  const mediaX = x + inset
  const mediaY = y + inset

  context.save()
  roundedRect(context, mediaX, mediaY, mediaWidth, mediaHeight, 2)
  context.clip()

  if (image?.complete && image.naturalWidth > 0) {
    drawCoverImage(context, image, mediaX, mediaY, mediaWidth, mediaHeight)
  } else {
    const fallback = context.createLinearGradient(
      mediaX,
      mediaY,
      mediaX + mediaWidth,
      mediaY + mediaHeight,
    )
    fallback.addColorStop(0, colors[0])
    fallback.addColorStop(1, colors[1])
    context.fillStyle = fallback
    context.fillRect(mediaX, mediaY, mediaWidth, mediaHeight)
  }

  const light = context.createLinearGradient(
    mediaX,
    mediaY,
    mediaX + mediaWidth,
    mediaY + mediaHeight,
  )
  light.addColorStop(0, "rgba(255, 255, 255, 0.42)")
  light.addColorStop(0.48, "rgba(255, 255, 255, 0)")
  light.addColorStop(1, "rgba(15, 23, 42, 0.16)")
  context.fillStyle = light
  context.fillRect(mediaX, mediaY, mediaWidth, mediaHeight)
  context.restore()
  context.restore()
}

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}
