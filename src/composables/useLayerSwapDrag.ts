import { inject } from 'vue';
import type { ShallowRef } from 'vue';
import { vcsLayerName, WMSLayer } from '@vcmap/core';
import type { IndexedCollection } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { moveDraggableItems } from '@vcmap/ui';
import type {
  DropZones,
  ItemMovedEvent,
  VcsDraggableItem,
  VcsUiApp,
} from '@vcmap/ui';
import { wmsLayerName } from './useLayerTreeItems';
import type { LayerTreeItem } from './useLayerTreeItems';

export interface UseLayerSwapDrag {
  dropTargetZones: (
    item: VcsDraggableItem,
    targetItem: VcsDraggableItem,
  ) => DropZones;
  move: (event: ItemMovedEvent) => void;
}

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

export function useLayerSwapDrag(
  items: ShallowRef<LayerTreeItem[]>,
  refreshItems: () => void,
): UseLayerSwapDrag {
  const app = inject<VcsUiApp>('vcsApp')!;

  function dropTargetZones(
    item: VcsDraggableItem,
    targetItem: VcsDraggableItem,
  ): DropZones {
    const layerItem = item as LayerTreeItem;
    const layerTargetItem = targetItem as LayerTreeItem;
    const isTopLevelItem = items.value.some((i) => i.name === layerItem.name);
    const isTopLevelTarget = items.value.some(
      (i) => i.name === layerTargetItem.name,
    );
    if (
      isTopLevelItem !== isTopLevelTarget ||
      (!isTopLevelItem &&
        !isTopLevelTarget &&
        layerItem[vcsLayerName] !== layerTargetItem[vcsLayerName])
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

    refreshItems();
  }

  return { dropTargetZones, move };
}
