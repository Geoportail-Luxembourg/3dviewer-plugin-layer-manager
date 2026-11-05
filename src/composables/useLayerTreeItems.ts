import { inject, onUnmounted, shallowRef } from 'vue';
import type { ShallowRef } from 'vue';
import {
  moduleIdSymbol,
  OpenStreetMapLayer,
  RasterLayer,
  vcsLayerName,
  volatileModuleId,
  WMSLayer,
} from '@vcmap/core';
import type { Layer } from '@vcmap/core';
import { WMSGroupContentTreeItem } from '@vcmap/ui';
import type { VcsAction, VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';

export const wmsLayerName = Symbol('wmsLayerName');

export type LayerTreeItem = VcsTreeNodeItem & {
  index: number;
  [vcsLayerName]?: string;
  [wmsLayerName]?: string;
};

export interface UseLayerTreeItems {
  items: ShallowRef<LayerTreeItem[]>;
  refreshItems: () => void;
}

function getWmsGroupItemsMap(
  app: VcsUiApp,
): Map<string, WMSGroupContentTreeItem> {
  return new Map(
    [...app.contentTree]
      .filter(
        (i): i is WMSGroupContentTreeItem =>
          i instanceof WMSGroupContentTreeItem,
      )
      .map((i) => [i.toJSON().layerName, i]),
  );
}

function toDisplayOrder<T>(items: T[]): T[] {
  return [...items].reverse();
}

function getWmsChildren(
  layer: WMSLayer,
  contentTreeItem: WMSGroupContentTreeItem,
): LayerTreeItem[] {
  return toDisplayOrder(
    layer.getLayers().map((l, index) => ({
      name: `${layer.name}.${l}`,
      title: contentTreeItem.wmsEntries.find((e) => e.name === l)?.title || l,
      index,
      [wmsLayerName]: l,
      [vcsLayerName]: layer.name,
    })),
  );
}

function layerFilter(app: VcsUiApp, l: Layer): boolean {
  const { activeMap } = app.maps;
  return (
    !!activeMap &&
    l.active &&
    l[moduleIdSymbol] !== volatileModuleId &&
    l.isSupported(activeMap)
  );
}

type OpacityLayer = Layer & { opacity: number };

function isOpacityLayer(layer: Layer): layer is OpacityLayer {
  return layer instanceof RasterLayer || layer instanceof OpenStreetMapLayer;
}

function createOpacityAction(
  layer: OpacityLayer,
  previousOpacity: Map<string, number>,
  refreshItems: () => void,
): VcsAction {
  const isHidden = layer.opacity === 0;

  return {
    name: 'layer-swap.opacity',
    icon: isHidden ? 'mdi-eye-off' : 'mdi-eye',
    title: isHidden
      ? 'lux3dviewerPluginLayerManager.components.layerSwap.showButton'
      : 'lux3dviewerPluginLayerManager.components.layerSwap.hideButton',
    callback: (): void => {
      if (layer.opacity > 0) {
        previousOpacity.set(layer.name, layer.opacity);
        layer.opacity = 0;
      } else {
        layer.opacity = previousOpacity.get(layer.name) ?? 1;
        previousOpacity.delete(layer.name);
      }

      refreshItems();
    },
  };
}

// Collections and WMS LAYERS lists are ordered bottom-to-top. The tree
// displays them top-first, so every collection order is reversed for display.
function getLayerTreeItems(
  app: VcsUiApp,
  wmsGroupItemsMap: Map<string, WMSGroupContentTreeItem>,
  previousOpacity: Map<string, number>,
  refreshItems: () => void,
): LayerTreeItem[] {
  return toDisplayOrder(
    [...app.layers]
      .filter((l) => layerFilter(app, l))
      .map((l) => {
        const actions: VcsAction[] = [];

        if (isOpacityLayer(l)) {
          actions.push(createOpacityAction(l, previousOpacity, refreshItems));
        }

        actions.push({
          name: 'layer-swap.delete',
          icon: 'mdi-delete',
          title: 'components.layerSwap.deleteButton',
          callback: (): void => {
            l.deactivate();
          },
        });

        const item: LayerTreeItem = {
          name: l.name,
          title: (l.properties?.title as string | undefined) || l.name,
          index: app.layers.indexOf(l),
          actions,
          blockOverflow: false,
        };

        const wmsGroupItem = wmsGroupItemsMap.get(l.name);
        if (wmsGroupItem && l instanceof WMSLayer) {
          return {
            ...item,
            children: getWmsChildren(l, wmsGroupItem),
          };
        }

        return item;
      }),
  );
}

export function useLayerTreeItems(): UseLayerTreeItems {
  const app = inject<VcsUiApp>('vcsApp')!;
  const wmsGroupItemsMap = getWmsGroupItemsMap(app);
  const previousOpacity = new Map<string, number>();

  const items = shallowRef<LayerTreeItem[]>([]);

  function refreshItems(): void {
    items.value = getLayerTreeItems(
      app,
      wmsGroupItemsMap,
      previousOpacity,
      refreshItems,
    );
  }

  refreshItems();

  const listeners = [
    app.layers.stateChanged.addEventListener(refreshItems),
    app.maps.mapActivated.addEventListener(refreshItems),
  ];

  onUnmounted(() => {
    listeners.forEach((removeListener) => {
      removeListener();
    });
    previousOpacity.clear();
  });

  return { items, refreshItems };
}
