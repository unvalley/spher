const preloadedImageSources = new Set<string>();
const preloadedImageElements = new Map<string, HTMLImageElement>();
const preloadingImageSources = new Set<string>();

export const preloadArchiveImages = (sources: string[], priorityCount = 36) => {
  if (typeof window === "undefined") return () => {};

  const pendingSources = sources.filter(
    (source) =>
      !preloadedImageSources.has(source) && !preloadingImageSources.has(source),
  );
  let cancelled = false;
  let index = 0;
  let timeoutId: number | undefined;

  const loadImage = (source: string, priority: "high" | "low") => {
    if (
      preloadedImageSources.has(source) ||
      preloadingImageSources.has(source)
    ) {
      return;
    }

    preloadingImageSources.add(source);
    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    image.setAttribute("fetchpriority", priority);
    image.src = source;
    preloadedImageElements.set(source, image);

    const decodePromise =
      typeof image.decode === "function"
        ? image.decode()
        : new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject();
          });

    void decodePromise
      .then(() => {
        preloadedImageSources.add(source);
      })
      .catch(() => undefined)
      .finally(() => {
        preloadingImageSources.delete(source);
      });
  };

  const run = () => {
    let loadedCount = 0;
    const batchSize = index < priorityCount ? 16 : 10;

    while (
      !cancelled &&
      index < pendingSources.length &&
      loadedCount < batchSize
    ) {
      loadImage(pendingSources[index], index < priorityCount ? "high" : "low");
      index += 1;
      loadedCount += 1;
    }

    if (!cancelled && index < pendingSources.length) {
      schedule();
    }
  };

  const schedule = () => {
    timeoutId = window.setTimeout(run, index < priorityCount ? 0 : 80);
  };

  schedule();

  return () => {
    cancelled = true;
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
};
