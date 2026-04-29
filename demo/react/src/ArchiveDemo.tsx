import { useMemo, useState } from "react"
import type { SpherDomItem } from "../../../src/dom/index.js"
import { Spher, type SpherRenderState } from "../../../src/react.js"

type ArchiveItem = SpherDomItem & {
  title: string
  year: number
  category: string
  image: string
  coordinates: {
    latitude: number
    longitude: number
  }
  cardSize: number
}

const items: ArchiveItem[] = [
  {
    id: "socrates",
    title: "Socrates",
    year: -470,
    category: "philosophy",
    image:
      "https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 24, longitude: -18 },
    cardSize: 88,
  },
  {
    id: "alexandria",
    title: "Library of Alexandria",
    year: -283,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1519682577862-22b62b24e493?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 2, longitude: 26 },
    cardSize: 96,
  },
  {
    id: "astrolabe",
    title: "Astrolabe",
    year: 150,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: -18, longitude: 70 },
    cardSize: 76,
  },
  {
    id: "printing",
    title: "Movable Type",
    year: 1040,
    category: "archive",
    image:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 36, longitude: 122 },
    cardSize: 82,
  },
  {
    id: "observatory",
    title: "Observatory",
    year: 1577,
    category: "instrument",
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: -32, longitude: -108 },
    cardSize: 90,
  },
  {
    id: "web",
    title: "World Wide Web",
    year: 1989,
    category: "network",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 10, longitude: -148 },
    cardSize: 84,
  },
]

const categories = ["all", "archive", "instrument", "network", "philosophy"]

export const ArchiveDemo = () => {
  const [category, setCategory] = useState("all")
  const [selectedId, setSelectedId] = useState(items[0].id)
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
        getItemPosition={(item) => item.coordinates}
        getItemSize={(item) => item.cardSize}
        items={visibleItems}
        onSelect={(item) => setSelectedId(item.id)}
        perspective={860}
        radius={260}
        renderItem={(item, state) => <ArchiveCard item={item} state={state} />}
        selectedId={selected?.id ?? null}
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

const ArchiveCard = ({
  item,
  state,
}: {
  item: ArchiveItem
  state: SpherRenderState<ArchiveItem>
}) => {
  return (
    <button
      className="archive-card"
      data-selected={state.selected}
      style={{ opacity: state.visibility }}
      type="button"
    >
      <img alt="" src={item.image} />
      <span>{item.title}</span>
    </button>
  )
}
