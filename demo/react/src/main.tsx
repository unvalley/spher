import { createRoot } from "react-dom/client"
import { SpherDemo } from "./SpherDemo.js"
import "./styles.css"

const root = document.getElementById("root")

if (root) {
  createRoot(root).render(<SpherDemo />)
}
