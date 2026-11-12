import { inject, onUnmounted, shallowRef } from 'vue';
import type { ShallowRef } from 'vue';
import {
  moduleIdSymbol,
  vcsLayerName,
  volatileModuleId,
  WMSLayer,
} from '@vcmap/core';
import type { Layer } from '@vcmap/core';
import { createLinkAction, WMSGroupContentTreeItem } from '@vcmap/ui';
import type { VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';

export const wmsLayerName = Symbol('wmsLayerName');

const metadataUrl =
  'https://geocatalogue.geoportail.lu/geonetwork/srv/eng/catalog.search#/metadata/4c8abde8-f7dd-49d8-a977-43a1797f2822';

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

// Collections and WMS LAYERS lists are ordered bottom-to-top. The tree
// displays them top-first, so every collection order is reversed for display.
function getLayerTreeItems(
  app: VcsUiApp,
  wmsGroupItemsMap: Map<string, WMSGroupContentTreeItem>,
): LayerTreeItem[] {
  return toDisplayOrder(
    [...app.layers]
      .filter((l) => layerFilter(app, l))
      .map((l) => {
        const item: LayerTreeItem = {
          name: l.name,
          title: (l.properties?.title as string | undefined) || l.name,
          index: app.layers.indexOf(l),
          actions: [
            createLinkAction(
              {
                name: 'layer-swap.info',
                icon: '$vcsInfo',
                title:
                  'lux3dviewerPluginLayerManager.components.layerSwap.infoButton',
              },
              metadataUrl,
            ),
            {
              name: 'layer-swap.delete',
              icon: 'mdi-delete',
              title: 'components.layerSwap.deleteButton',
              callback: (): void => {
                l.deactivate();
              },
            },
          ],
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

  const items = shallowRef<LayerTreeItem[]>([]);

  function refreshItems(): void {
    items.value = getLayerTreeItems(app, wmsGroupItemsMap);
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
  });

  return { items, refreshItems };
}
