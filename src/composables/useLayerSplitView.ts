import { inject, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import { SplitDirection } from '@vcmap-cesium/engine';
import type { Layer, SplitLayer } from '@vcmap/core';
import type { VcsUiApp } from '@vcmap/ui';
import LayerSplitElement from '../utils/layerSplitElement';

export type SplitableLayer = Layer & SplitLayer;

export function isSplitLayer(
  layer: Layer | undefined,
): layer is SplitableLayer {
  return (
    !!layer && 'splitDirection' in layer && layer.splitDirection !== undefined
  );
}

export interface UseLayerSplitView {
  activeLayerName: Ref<string | null>;
  canSplit: (layerName: string | null) => boolean;
  toggle: (layerName: string) => void;
  updateActiveLayer: (layerName: string) => void;
  stop: () => void;
}

export function useLayerSplitView(): UseLayerSplitView {
  const app = inject<VcsUiApp>('vcsApp')!;
  const splitElement = new LayerSplitElement(app);
  const activeLayerName = ref<string | null>(null);
  const initialDirections = new Map<string, SplitDirection>();
  let initialSplitPosition: number | null = null;

  function canSplit(layerName: string | null): boolean {
    return !!layerName && isSplitLayer(app.layers.getByKey(layerName));
  }

  function getLayerTitle(layerName: string): string {
    const layer = app.layers.getByKey(layerName);
    const title = (layer?.properties?.title as string | undefined) || layerName;
    return app.vueI18n.t(title);
  }

  function captureState(): void {
    initialDirections.clear();
    [...app.layers].forEach((layer) => {
      if (isSplitLayer(layer)) {
        initialDirections.set(layer.name, layer.splitDirection);
      }
    });
    initialSplitPosition = app.maps.splitPosition;
  }

  function applyDirections(): void {
    [...app.layers].forEach((layer) => {
      if (!isSplitLayer(layer)) {
        return;
      }

      layer.splitDirection =
        layer.name === activeLayerName.value
          ? SplitDirection.LEFT
          : SplitDirection.NONE;
    });
  }

  function restoreState(): void {
    [...app.layers].forEach((layer) => {
      if (!isSplitLayer(layer)) {
        return;
      }

      layer.splitDirection =
        initialDirections.get(layer.name) ?? SplitDirection.NONE;
    });

    if (initialSplitPosition !== null) {
      app.maps.splitPosition = initialSplitPosition;
    }

    initialDirections.clear();
    initialSplitPosition = null;
  }

  function stop(): void {
    if (!activeLayerName.value) {
      return;
    }

    splitElement.deactivate();
    restoreState();
    activeLayerName.value = null;
  }

  function start(layerName: string): void {
    if (!canSplit(layerName)) {
      return;
    }

    stop();
    captureState();
    activeLayerName.value = layerName;
    splitElement.setTitle(getLayerTitle(layerName));
    app.maps.splitPosition = 0.5;
    applyDirections();
    splitElement.activate();
  }

  function updateActiveLayer(layerName: string): void {
    if (!activeLayerName.value || activeLayerName.value === layerName) {
      return;
    }

    if (!canSplit(layerName)) {
      stop();
      return;
    }

    activeLayerName.value = layerName;
    splitElement.setTitle(getLayerTitle(layerName));
    applyDirections();
  }

  function toggle(layerName: string): void {
    if (activeLayerName.value === layerName) {
      stop();
    } else {
      start(layerName);
    }
  }

  const addLayerListener = app.layers.added.addEventListener((layer) => {
    if (!activeLayerName.value || !isSplitLayer(layer)) {
      return;
    }

    initialDirections.set(layer.name, layer.splitDirection);
    applyDirections();
  });

  const removeLayerListener = app.layers.removed.addEventListener((layer) => {
    if (layer.name === activeLayerName.value) {
      stop();
    }
  });

  onUnmounted(() => {
    stop();
    addLayerListener();
    removeLayerListener();
    splitElement.destroy();
  });

  return { activeLayerName, canSplit, toggle, updateActiveLayer, stop };
}
