import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { brotliCompressSync, gzipSync } from "node:zlib"
import { build } from "tsdown"

const rootDir = path.resolve(import.meta.dirname, "..")

const entryPoints = [
  {
    name: "spher",
    path: "dist/index.js",
    limit: 6 * 1024,
  },
  {
    external: ["react", "react/jsx-runtime"],
    name: "spher/react",
    path: "dist/react/index.js",
    limit: 7 * 1024,
  },
]

const formatSize = (bytes) => `${(bytes / 1024).toFixed(2)}kb`

const bundleEntry = async (entry) => {
  const absoluteEntryPath = path.join(rootDir, entry.path)

  if (!existsSync(absoluteEntryPath)) {
    throw new Error(`Missing ${entry.path}. Run \`pnpm build\` before checking size.`)
  }

  const bundles = await build({
    clean: false,
    config: false,
    cwd: rootDir,
    deps: {
      neverBundle: entry.external ?? [],
    },
    dts: false,
    entry: [absoluteEntryPath],
    format: "esm",
    logLevel: "error",
    minify: true,
    platform: "browser",
    target: "es2020",
    write: false,
  })

  const chunks = bundles.flatMap((bundle) => bundle.chunks)
  const entryChunk = chunks.find((chunk) => chunk.type === "chunk" && chunk.isEntry)

  await Promise.all(bundles.map((bundle) => bundle[Symbol.asyncDispose]?.()))

  if (!entryChunk) {
    throw new Error(`Could not bundle ${entry.path}.`)
  }

  return Buffer.from(entryChunk.code)
}

const checkEntry = async (entry) => {
  const rawFile = await readFile(path.join(rootDir, entry.path))
  const bundled = await bundleEntry(entry)
  const gzip = gzipSync(bundled)
  const brotli = brotliCompressSync(bundled)
  const relativePath = path.relative(rootDir, path.join(rootDir, entry.path))
  const status = brotli.length <= entry.limit ? "ok" : "over"

  console.log(
    `${entry.name} (${relativePath}) raw:${formatSize(rawFile.length)} / bundle:${formatSize(bundled.length)} / gzip:${formatSize(gzip.length)} / brotli:${formatSize(brotli.length)} / limit:${formatSize(entry.limit)} ${status}`,
  )

  if (brotli.length > entry.limit) {
    throw new Error(`${entry.name} exceeds brotli limit: ${formatSize(brotli.length)}`)
  }
}

for (const entry of entryPoints) {
  await checkEntry(entry)
}
