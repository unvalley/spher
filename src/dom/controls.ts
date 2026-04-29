import type { OrbaDomControls } from "./types.js";

export type ResolvedOrbaDomControls = {
  drag: boolean;
  wheel: boolean;
  preventDocumentScroll: boolean;
};

export const normalizeControls = (
  controls: OrbaDomControls | undefined,
): ResolvedOrbaDomControls => {
  if (controls === true) {
    return {
      drag: true,
      wheel: true,
      preventDocumentScroll: false,
    };
  }
  if (!controls) {
    return {
      drag: false,
      wheel: false,
      preventDocumentScroll: false,
    };
  }
  return {
    drag: controls.drag ?? false,
    wheel: controls.wheel ?? false,
    preventDocumentScroll: controls.preventDocumentScroll ?? false,
  };
};
