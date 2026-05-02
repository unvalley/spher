import type { SpherCanvasControls } from "./types.js"

export type ResolvedSpherCanvasControls = {
  autoRotate: boolean
  autoRotateSpeed: number
  drag: boolean
  keyboard: boolean
  wheel: boolean
  preventDocumentScroll: boolean
}

const defaultAutoRotateSpeed = 0.18

export const normalizeCanvasControls = (
  controls: SpherCanvasControls | undefined,
): ResolvedSpherCanvasControls => {
  if (controls === true) {
    return {
      autoRotate: false,
      autoRotateSpeed: defaultAutoRotateSpeed,
      drag: true,
      keyboard: true,
      wheel: true,
      preventDocumentScroll: false,
    }
  }
  if (!controls) {
    return {
      autoRotate: false,
      autoRotateSpeed: defaultAutoRotateSpeed,
      drag: false,
      keyboard: false,
      wheel: false,
      preventDocumentScroll: false,
    }
  }
  const autoRotate = typeof controls.autoRotate === "object" ? true : (controls.autoRotate ?? false)
  return {
    autoRotate,
    autoRotateSpeed:
      typeof controls.autoRotate === "object"
        ? (controls.autoRotate.speed ?? defaultAutoRotateSpeed)
        : defaultAutoRotateSpeed,
    drag: controls.drag ?? false,
    keyboard: controls.keyboard ?? false,
    wheel: controls.wheel ?? false,
    preventDocumentScroll: controls.preventDocumentScroll ?? false,
  }
}
