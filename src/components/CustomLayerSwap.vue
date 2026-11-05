<script setup lang="ts">
  import { inject, onUnmounted, shallowRef } from 'vue';
  import { VSheet } from 'vuetify/components';
  import {
    moduleIdSymbol,
    vcsLayerName,
    volatileModuleId,
    WMSLayer,
  } from '@vcmap/core';
  import type { IndexedCollection, Layer } from '@vcmap/core';
  import { getLogger } from '@vcsuite/logger';
  import {
    moveDraggableItems,
    VcsTreeview,
    WMSGroupContentTreeItem,
  } from '@vcmap/ui';
  import type {
    DropZones,
    ItemMovedEvent,
    VcsDraggableItem,
    VcsTreeNodeItem,
    VcsUiApp,
  } from '@vcmap/ui';

  defineOptions({ name: 'VcsLayerSwap' });

  const wmsLayerName = Symbol('wmsLayerName');

  type LayerTreeItem = VcsTreeNodeItem & {
    index: number;
    [vcsLayerName]?: string;
    [wmsLayerName]?: string;
  };

  function moveItem<T>(
    collection: IndexedCollection<T>,
    event: ItemMovedEvent,
  ): void {
    const item = collection.getByKey(event.item.name);
    const target = collection.getByKey(event.targetItem.name);
    if (!item || !target) {
      return;
    }

    const itemIndex = collection.indexOf(item);
    const targetIndex = collection.indexOf(target);
    const relativePosition = itemIndex < targetIndex ? -1 : 1;
    const offset =
      relativePosition === event.position ? (event.position ?? 0) : 0;
    collection.moveTo(item, targetIndex + offset);
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

  function getWmsChildren(
    layer: WMSLayer,
    contentTreeItem: WMSGroupContentTreeItem,
  ): LayerTreeItem[] {
    return layer.getLayers().map((l, index) => ({
      name: `${layer.name}.${l}`,
      title: contentTreeItem.wmsEntries.find((e) => e.name === l)?.title || l,
      index,
      [wmsLayerName]: l,
      [vcsLayerName]: layer.name,
    }));
  }

  const app = inject<VcsUiApp>('vcsApp')!;
  const wmsGroupItemsMap = getWmsGroupItemsMap(app);

  function layerFilter(l: Layer): boolean {
    const { activeMap } = app.maps;
    return (
      !!activeMap &&
      l.active &&
      l[moduleIdSymbol] !== volatileModuleId &&
      l.isSupported(activeMap)
    );
  }

  function getLayerTreeItems(): LayerTreeItem[] {
    return [...app.layers].filter(layerFilter).map((l) => {
      const item: LayerTreeItem = {
        name: l.name,
        title: (l.properties?.title as string | undefined) || l.name,
        index: app.layers.indexOf(l),
        actions: [
          {
            name: 'layer-swap.delete',
            icon: 'mdi-delete',
            title: 'components.layerSwap.deleteButton',
            callback: (): void => {
              l.deactivate();
            },
          },
        ],
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
    });
  }

  const items = shallowRef<LayerTreeItem[]>(getLayerTreeItems());

  const listeners = [
    app.layers.stateChanged.addEventListener(() => {
      items.value = getLayerTreeItems();
    }),
    app.maps.mapActivated.addEventListener(() => {
      items.value = getLayerTreeItems();
    }),
  ];

  onUnmounted(() => {
    listeners.forEach((removeListener) => {
      removeListener();
    });
  });

  function dropTargetZones(
    item: LayerTreeItem,
    targetItem: LayerTreeItem,
  ): DropZones {
    const isTopLevelItem = items.value.some((i) => i.name === item.name);
    const isTopLevelTarget = items.value.some(
      (i) => i.name === targetItem.name,
    );
    if (
      isTopLevelItem !== isTopLevelTarget ||
      (!isTopLevelItem &&
        !isTopLevelTarget &&
        item[vcsLayerName] !== targetItem[vcsLayerName])
    ) {
      return false;
    }

    return { before: true, after: true, into: false };
  }

  function move(event: ItemMovedEvent): void {
    const item = event.item as LayerTreeItem;
    const targetItem = event.targetItem as LayerTreeItem;
    const layer = app.layers.getByKey(item.name);

    if (layer && !targetItem[vcsLayerName]) {
      moveItem(app.layers, event);
    } else if (item[vcsLayerName] === targetItem[vcsLayerName]) {
      const wmsLayer = app.layers.getByKey(item[vcsLayerName]!);
      if (wmsLayer instanceof WMSLayer) {
        const newLayerNames = wmsLayer.getLayers();
        moveDraggableItems(newLayerNames as unknown as VcsDraggableItem[], {
          item: item[wmsLayerName] as unknown as VcsDraggableItem,
          targetItem: targetItem[wmsLayerName] as unknown as VcsDraggableItem,
          targetIndex: event.targetIndex,
          position: event.position,
        });
        wmsLayer.setLayers(newLayerNames).catch((e: unknown) => {
          getLogger('LayerSwap.vue').error(String(e));
        });
      }
    }

    items.value = getLayerTreeItems();
  }
</script>

<template>
  <div class="layer-tree">
    <VcsTreeview
      v-if="items && items.length"
      :items="items.reverse()"
      :show-searchbar="false"
      :draggable="true"
      open-all
      :drop-target-zones="dropTargetZones"
      @item-moved="move"
    />
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>
