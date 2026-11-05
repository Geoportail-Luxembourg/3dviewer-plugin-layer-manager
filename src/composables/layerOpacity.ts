import { OpenStreetMapLayer, RasterLayer } from '@vcmap/core';
import type { Layer } from '@vcmap/core';

export type OpacityLayer = Layer & { opacity: number };

const previousOpacity = new Map<string, number>();

export function isOpacityLayer(
  layer: Layer | undefined,
): layer is OpacityLayer {
  return layer instanceof RasterLayer || layer instanceof OpenStreetMapLayer;
}

export function toggleLayerOpacity(layer: OpacityLayer): void {
  if (layer.opacity > 0) {
    previousOpacity.set(layer.name, layer.opacity);
    layer.opacity = 0;
  } else {
    layer.opacity = previousOpacity.get(layer.name) ?? 1;
    previousOpacity.delete(layer.name);
  }
}

export function setLayerOpacity(layer: OpacityLayer, value: number): void {
  const opacity = Math.min(1, Math.max(0, value));
  layer.opacity = opacity;

  if (opacity > 0) {
    previousOpacity.delete(layer.name);
  }
}
