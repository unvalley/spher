export { clamp, cssNumber, toRadians } from "./math.js";
export { findNearestProjectedItem, type OrbaRect } from "./hit-test.js";
export {
  getFibonacciSpherePosition,
  getLatitudeLongitudeGridPosition,
  getLatitudeLongitudeGridRowCounts,
  getSphericalPosition,
  placeItems,
  type SphericalPosition,
} from "./placement.js";
export {
  projectItems,
  selectInsideVisibleItemIds,
  type OrbaRotation,
} from "./projection.js";
export type {
  OrbaItemBase,
  OrbaPlacement,
  PositionedItem,
  ProjectedItem,
} from "./types.js";
