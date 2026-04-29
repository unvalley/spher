import { clamp, toRadians } from "./math.js";
import type {
  OrbaItemBase,
  PositionedItem,
  SphericalArchiveItemBase,
  SphericalArchivePlacement,
} from "./types.js";

export type SphericalPosition = {
  longitude: number;
  latitude: number;
  baseX: number;
  baseY: number;
  baseZ: number;
};

export const positionItems = <TItem extends SphericalArchiveItemBase,>(
  items: TItem[],
  sphereRadius: number,
  placement: SphericalArchivePlacement,
  getItemSize?: (item: TItem) => number,
): PositionedItem<TItem>[] => {
  const sortedItems = [...items].sort((a, b) => a.year - b.year);

  return sortedItems.map((item, index) => {
    const { longitude, latitude, baseX, baseY, baseZ } =
      placement === "latitude-longitude-grid"
        ? getLatitudeLongitudeGridPosition(
            index,
            sortedItems.length,
            sphereRadius,
          )
        : getFibonacciSpherePosition(index, sortedItems.length, sphereRadius);
    const clampedLatitude = clamp(latitude, -82, 82);

    return {
      ...item,
      longitude,
      latitude: clampedLatitude,
      baseX,
      baseY,
      baseZ,
      radius: sphereRadius,
      roll: 0,
      size: getItemSize?.(item) ?? 64,
    };
  });
};

export const getFibonacciSpherePosition = (
  index: number,
  itemCount: number,
  sphereRadius: number,
): SphericalPosition => {
  const goldenAngle = 137.50776405003785;
  const y = 1 - (2 * (index + 0.5)) / Math.max(1, itemCount);
  const longitude = (((index * goldenAngle + 180) % 360) + 360) % 360 - 180;
  const latitude = Math.asin(clamp(y, -1, 1)) * (180 / Math.PI);
  const longitudeRadians = toRadians(longitude);
  const latitudeRadians = toRadians(latitude);

  return {
    longitude,
    latitude,
    baseX:
      -Math.sin(longitudeRadians) * Math.cos(latitudeRadians) * sphereRadius,
    baseY: Math.sin(latitudeRadians) * sphereRadius,
    baseZ:
      -Math.cos(longitudeRadians) * Math.cos(latitudeRadians) * sphereRadius,
  };
};

export const getSphericalPosition = (
  latitude: number,
  longitude: number,
  sphereRadius: number,
): SphericalPosition => {
  const longitudeRadians = toRadians(longitude);
  const latitudeRadians = toRadians(latitude);

  return {
    longitude,
    latitude,
    baseX:
      -Math.sin(longitudeRadians) * Math.cos(latitudeRadians) * sphereRadius,
    baseY: Math.sin(latitudeRadians) * sphereRadius,
    baseZ:
      -Math.cos(longitudeRadians) * Math.cos(latitudeRadians) * sphereRadius,
  };
};

export const placeItems = <TItem extends OrbaItemBase,>(
  items: TItem[],
  sphereRadius: number,
  placement: SphericalArchivePlacement,
  getItemSize?: (item: TItem) => number,
  getItemPosition?: (
    item: TItem,
    index: number,
    items: TItem[],
  ) => Pick<SphericalPosition, "latitude" | "longitude"> | null | undefined,
): PositionedItem<TItem>[] => {
  return items.map((item, index) => {
    const explicitPosition = getItemPosition?.(item, index, items);
    const { longitude, latitude, baseX, baseY, baseZ } = explicitPosition
      ? getSphericalPosition(
          explicitPosition.latitude,
          explicitPosition.longitude,
          sphereRadius,
        )
      : placement === "latitude-longitude-grid"
        ? getLatitudeLongitudeGridPosition(index, items.length, sphereRadius)
        : getFibonacciSpherePosition(index, items.length, sphereRadius);
    const clampedLatitude = clamp(latitude, -82, 82);

    return {
      ...item,
      longitude,
      latitude: clampedLatitude,
      baseX,
      baseY,
      baseZ,
      radius: sphereRadius,
      roll: 0,
      size: getItemSize?.(item) ?? 64,
    };
  });
};

export const getLatitudeLongitudeGridPosition = (
  index: number,
  itemCount: number,
  sphereRadius: number,
): SphericalPosition => {
  const ringCount = itemCount % 7 === 0 ? 7 : 9;
  const rowCounts = getLatitudeLongitudeGridRowCounts(itemCount, ringCount);
  let row = 0;
  let indexInRow = index;
  while (row < rowCounts.length - 1 && indexInRow >= rowCounts[row]) {
    indexInRow -= rowCounts[row];
    row += 1;
  }

  const columnCount = rowCounts[row];
  const latitudeStart = -66;
  const latitudeEnd = 66;
  const latitude =
    latitudeStart +
    (row / Math.max(1, ringCount - 1)) * (latitudeEnd - latitudeStart);
  const longitude = -180 + ((indexInRow + 0.5) / columnCount) * 360;
  const longitudeRadians = toRadians(longitude);
  const latitudeRadians = toRadians(latitude);

  return {
    longitude,
    latitude,
    baseX:
      -Math.sin(longitudeRadians) * Math.cos(latitudeRadians) * sphereRadius,
    baseY: Math.sin(latitudeRadians) * sphereRadius,
    baseZ:
      -Math.cos(longitudeRadians) * Math.cos(latitudeRadians) * sphereRadius,
  };
};

export const getLatitudeLongitudeGridRowCounts = (
  itemCount: number,
  ringCount: number,
) => {
  const rowWeights = Array.from({ length: ringCount }, (_, row) =>
    row === 0 || row === ringCount - 1 ? 0.5 : 1,
  );
  const totalWeight = rowWeights.reduce((sum, weight) => sum + weight, 0);
  const rawCounts = rowWeights.map(
    (weight) => (itemCount * weight) / totalWeight,
  );
  const rowCounts = rawCounts.map((count) => Math.max(1, Math.floor(count)));
  let assignedCount = rowCounts.reduce((sum, count) => sum + count, 0);

  while (assignedCount < itemCount) {
    let targetRow = 0;
    let largestRemainder = -Infinity;
    for (let row = 0; row < ringCount; row += 1) {
      const remainder = rawCounts[row] - rowCounts[row];
      if (remainder > largestRemainder) {
        largestRemainder = remainder;
        targetRow = row;
      }
    }
    rowCounts[targetRow] += 1;
    assignedCount += 1;
  }

  return rowCounts;
};
