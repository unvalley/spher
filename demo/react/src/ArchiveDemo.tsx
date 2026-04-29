import { useEffect, useMemo, useState } from "react"
import type { SpherDomItem } from "../../../src/dom/index.js"
import { Spher, type SpherRenderState } from "../../../src/react.js"

type ArchiveItem = SpherDomItem & {
  title: string
  year: number
  category: string
  image: string
}

const sourceItems: ArchiveItem[] = [
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

const items: ArchiveItem[] = Array.from({ length: 4 }, (_, pass) =>
  sourceItems.map((item, index) => ({
    ...item,
    id: `${item.id}-${pass}`,
    year: item.year + pass * 11 + index,
  })),
).flat()

const categories = ["all", "archive", "instrument", "network", "philosophy"]

export const ArchiveDemo = () => {
  const [category, setCategory] = useState("all")
  const [selectedId, setSelectedId] = useState(items[0].id)
  const radius = useSphereRadius()
  const visibleItems = useMemo(
    () => (category === "all" ? items : items.filter((item) => item.category === category)),
    [category],
  )
  const selected = visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0]

  return (
    <main className="archive-demo">
      <header className="archive-header">
        <div>
          <p className="archive-kicker">spher React demo</p>
          <h1>Archive sphere</h1>
        </div>
        <nav aria-label="Filter archive" className="archive-filters">
          {categories.map((value) => (
            <button
              data-active={category === value}
              key={value}
              onClick={() => {
                setCategory(value)
                const nextItems =
                  value === "all" ? items : items.filter((item) => item.category === value)
                setSelectedId(nextItems[0]?.id ?? "")
              }}
              type="button"
            >
              {value}
            </button>
          ))}
        </nav>
      </header>

      <Spher
        className="archive-sphere"
        controls={{ drag: true, wheel: true }}
        items={visibleItems}
        onSelect={(item) => setSelectedId(item.id)}
        perspective={980}
        radius={radius}
        render={(item, state) => <ArchiveCard item={item} state={state} />}
        selectedId={selected?.id ?? null}
        size={52}
      />

      {selected ? (
        <aside className="archive-detail">
          <p>{selected.category}</p>
          <h2>{selected.title}</h2>
          <span>{selected.year}</span>
        </aside>
      ) : null}
    </main>
  )
}

const useSphereRadius = () => {
  const [radius, setRadius] = useState(280)

  useEffect(() => {
    const updateRadius = () => {
      setRadius(
        Math.min(310, Math.max(150, Math.min(window.innerWidth * 0.26, window.innerHeight * 0.34))),
      )
    }

    updateRadius()
    window.addEventListener("resize", updateRadius)
    return () => window.removeEventListener("resize", updateRadius)
  }, [])

  return radius
}

const ArchiveCard = ({
  item,
  state,
}: {
  item: ArchiveItem
  state: SpherRenderState<ArchiveItem>
}) => {
  return (
    <button
      aria-label={item.title}
      className="archive-card"
      data-selected={state.selected}
      type="button"
    >
      <img alt="" src={item.image} />
      <span>{item.title}</span>
    </button>
  )
}
