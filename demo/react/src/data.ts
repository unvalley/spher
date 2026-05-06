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
    coverFiles: [
      "abelard-photo.jpg",
      "beauvoir.png",
      "dewey-photo.jpg",
      "french-revolution-photo.jpg",
    ],
  },
  {
    id: "alexandria",
    coverFiles: ["abelard.jpg", "being-and-time-photo.jpg", "dewey.jpg", "french-revolution.jpg"],
  },
  {
    id: "astrolabe",
    coverFiles: [
      "adam-smith.jpg",
      "benjamin-photo.jpg",
      "diderot-photo.jpg",
      "fukuzawa-yukichi-photo.jpg",
    ],
  },
  {
    id: "printing",
    coverFiles: ["adorno.jpg", "benjamin.jpg", "diderot.jpg", "fukuzawa-yukichi.jpg"],
  },
  {
    id: "observatory",
    coverFiles: ["ai-ethics.jpg", "bentham-photo.jpg", "diogenes-photo.jpg", "galileo-trial.jpg"],
  },
  {
    id: "web",
    coverFiles: ["al-ghazali-photo.jpg", "bentham.jpg", "diogenes.jpg", "galileo-trial.png"],
  },
  {
    id: "rosetta",
    coverFiles: ["al-kindi-photo.jpg", "boethius.jpg", "dogen-photo.jpg", "great-wave-photo.jpg"],
  },
  {
    id: "antikythera",
    coverFiles: ["al-kindi.png", "buddha.png", "dogen.jpg", "great-wave.jpg"],
  },
  {
    id: "silk-road",
    coverFiles: [
      "alexandria-photo.jpg",
      "butler-photo.jpg",
      "du-bois-photo.jpg",
      "guernica-photo.jpg",
    ],
  },
  {
    id: "hypatia",
    coverFiles: ["alexandria.jpg", "butler.jpg", "du-bois.jpg", "habermas-photo.jpg"],
  },
  {
    id: "codex",
    coverFiles: ["analects-photo.jpg", "camus-photo.jpg", "duns-scotus-photo.jpg", "habermas.jpg"],
  },
  {
    id: "compass",
    coverFiles: ["analects.jpg", "capital-photo.jpg", "duns-scotus.jpg", "han-feizi-photo.jpg"],
  },
  {
    id: "telegraph",
    coverFiles: ["aquinas-photo.jpg", "comte-photo.jpg", "encyclopedie-photo.jpg", "han-feizi.png"],
  },
  {
    id: "nietzsche",
    coverFiles: ["arendt-photo.jpg", "dai-zhen-photo.jpg", "encyclopedie.jpg", "hegel-photo.jpg"],
  },
  {
    id: "phonograph",
    coverFiles: ["aristotle.jpg", "daodejing.jpg", "epicurus.jpg", "hegel.jpg"],
  },
  {
    id: "radio",
    coverFiles: ["ashoka.jpg", "daodejing.png", "fanon-photo.jpg", "heidegger-photo.jpg"],
  },
  {
    id: "enigma",
    coverFiles: ["augustine.jpg", "darwin-photo.jpg", "fanon.webp", "heraclitus-photo.jpg"],
  },
  {
    id: "turing",
    coverFiles: [
      "averroes.jpg",
      "death-of-socrates-photo.jpg",
      "foucault-photo.jpg",
      "heraclitus.jpg",
    ],
  },
  {
    id: "magnetic-tape",
    coverFiles: ["avicenna-photo.jpg", "death-of-socrates.jpg", "foucault.jpg", "hildegard.jpg"],
  },
  {
    id: "satellite",
    coverFiles: [
      "bacon-photo.jpg",
      "declaration-rights-photo.jpg",
      "four-books-photo.jpg",
      "hobbes-photo.jpg",
    ],
  },
  {
    id: "microchip",
    coverFiles: [
      "bacon.jpg",
      "declaration-rights.jpg",
      "frankfurt-school-photo.jpg",
      "house-of-wisdom-photo.jpg",
    ],
  },
  {
    id: "internet",
    coverFiles: ["bacon.png", "derrida-photo.jpg", "frege-photo.jpg", "house-of-wisdom.jpg"],
  },
  {
    id: "notebook",
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
