import type {
  OrbaItemBase,
  PositionedItem,
  ProjectedItem,
} from "./types.js";

export type OrbaRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const findNearestProjectedItem = <TItem extends OrbaItemBase>(
  clientX: number,
  clientY: number,
  projectedItems: ProjectedItem<TItem>[],
  sceneRect: OrbaRect,
) => {
  const centerX = sceneRect.left + sceneRect.width / 2;
  const centerY = sceneRect.top + sceneRect.height / 2;
  let nearest: { item: PositionedItem<TItem>; distance: number } | null = null;

  for (const {
    item,
    projectedX,
    projectedY,
    perspectiveScale,
  } of projectedItems) {
    const screenX = centerX + projectedX;
    const screenY = centerY + projectedY;
    const distance = Math.hypot(screenX - clientX, screenY - clientY);
    const hitRadius = Math.max(40, item.size * perspectiveScale * 0.82);

    if (distance <= hitRadius && (!nearest || distance < nearest.distance)) {
      nearest = { item, distance };
    }
  }

  return nearest?.item ?? null;
};
