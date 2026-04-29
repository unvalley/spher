import { createRoot } from "react-dom/client"
import { ArchiveDemo } from "./ArchiveDemo.js"
import "./styles.css"

const root = document.getElementById("root")

if (root) {
  createRoot(root).render(<ArchiveDemo />)
}
