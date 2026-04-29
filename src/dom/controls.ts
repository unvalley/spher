import type { SpherDomControls } from "./types.js"

export type ResolvedSpherDomControls = {
  drag: boolean
  keyboard: boolean
  wheel: boolean
  preventDocumentScroll: boolean
}

export const normalizeControls = (
  controls: SpherDomControls | undefined,
): ResolvedSpherDomControls => {
  if (controls === true) {
    return {
      drag: true,
      keyboard: true,
      wheel: true,
      preventDocumentScroll: false,
    }
  }
  if (!controls) {
    return {
      drag: false,
      keyboard: false,
      wheel: false,
      preventDocumentScroll: false,
    }
  }
  return {
    drag: controls.drag ?? false,
    keyboard: controls.keyboard ?? false,
    wheel: controls.wheel ?? false,
    preventDocumentScroll: controls.preventDocumentScroll ?? false,
  }
}
