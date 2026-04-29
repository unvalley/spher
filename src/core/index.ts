export { clamp, cssNumber, toRadians } from "./math.js";
export { findNearestProjectedItem, type OrbaRect } from "./hit-test.js";
export {
  getFibonacciSpherePosition,
  getLatitudeLongitudeGridPosition,
  getLatitudeLongitudeGridRowCounts,
  getSphericalPosition,
  placeItems,
  positionItems,
  type SphericalPosition,
} from "./placement.js";
export {
  projectItems,
  selectInsideVisibleItemIds,
  type OrbaRotation,
} from "./projection.js";
export type {
  OrbaArchiveItemBase,
  OrbaFaceDirection,
  OrbaItemBase,
  OrbaPlacement,
  OrbaViewMode,
  PositionedItem,
  ProjectedItem,
} from "./types.js";
