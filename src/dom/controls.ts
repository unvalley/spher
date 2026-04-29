import type { SpherDomControls } from "./types.js"

export type ResolvedSpherDomControls = {
  drag: boolean
  wheel: boolean
  preventDocumentScroll: boolean
}

export const normalizeControls = (
  controls: SpherDomControls | undefined,
): ResolvedSpherDomControls => {
  if (controls === true) {
    return {
      drag: true,
      wheel: true,
      preventDocumentScroll: false,
    }
  }
  if (!controls) {
    return {
      drag: false,
      wheel: false,
      preventDocumentScroll: false,
    }
  }
  return {
    drag: controls.drag ?? false,
    wheel: controls.wheel ?? false,
    preventDocumentScroll: controls.preventDocumentScroll ?? false,
  }
}
