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
import type {
  ContentTreeItemOptions,
  VcsAction,
  VcsTreeNodeItem,
  VcsUiApp,
} from '@vcmap/ui';

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

function getLayerInfoUrls(app: VcsUiApp): Map<string, string> {
  const infoUrls = new Map<string, string>();

  [...app.contentTree].forEach((item) => {
    const config = item.toJSON() as ContentTreeItemOptions & {
      layerName?: string;
      infoUrl?: string;
    };
    if (config.layerName && config.infoUrl) {
      infoUrls.set(config.layerName, config.infoUrl);
    }
  });

  return infoUrls;
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
  layerInfoUrls: Map<string, string>,
): LayerTreeItem[] {
  return toDisplayOrder(
    [...app.layers]
      .filter((l) => layerFilter(app, l))
      .map((l) => {
        const actions: VcsAction[] = [];
        const infoUrl = layerInfoUrls.get(l.name);

        actions.push({
          name: 'layer-swap.delete',
          icon: 'mdi-delete',
          title: 'components.layerSwap.deleteButton',
          callback: (): void => {
            l.deactivate();
          },
        });

        if (infoUrl) {
          actions.push(
            createLinkAction(
              {
                name: 'layer-swap.info',
                icon: '$vcsInfo',
                title:
                  'lux3dviewerPluginLayerManager.components.layerSwap.infoButton',
              },
              infoUrl,
            ),
          );
        }

        const item: LayerTreeItem = {
          name: l.name,
          title: (l.properties?.title as string | undefined) || l.name,
          index: app.layers.indexOf(l),
          actions,
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
    items.value = getLayerTreeItems(
      app,
      wmsGroupItemsMap,
      getLayerInfoUrls(app),
    );
  }

  refreshItems();

  const listeners = [
    app.layers.stateChanged.addEventListener(refreshItems),
    app.maps.mapActivated.addEventListener(refreshItems),
    app.contentTree.added.addEventListener(refreshItems),
    app.contentTree.removed.addEventListener(refreshItems),
  ];

  onUnmounted(() => {
    listeners.forEach((removeListener) => {
      removeListener();
    });
  });

  return { items, refreshItems };
}
