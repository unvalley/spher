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

const itemSeeds = [
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

export const items = itemSeeds.flatMap(({ coverFiles, ...item }) =>
  coverFiles.map((cover, index) => ({
    ...item,
    id: `${item.id}-${index}`,
    cover: coverUrl(cover),
  })),
)
