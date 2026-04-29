export { findNearestProjectedItem, type SpherRect } from "./hit-test.js"
export { clamp, cssNumber, toRadians } from "./math.js"
export {
  getFibonacciSpherePosition,
  getLatitudeLongitudeGridPosition,
  getLatitudeLongitudeGridRowCounts,
  getSphericalPosition,
  placeItems,
  type SphericalPosition,
} from "./placement.js"
export {
  projectItems,
  type SpherRotation,
  selectInsideVisibleItemIds,
} from "./projection.js"
export type {
  PositionedItem,
  ProjectedItem,
  SpherItemBase,
  SpherPlacement,
} from "./types.js"
