import { inject } from 'vue';
import { vcsLayerName, WMSLayer } from '@vcmap/core';
import type { IndexedCollection } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { moveDraggableItems } from '@vcmap/ui';
import type { ItemMovedEvent, VcsDraggableItem, VcsUiApp } from '@vcmap/ui';
import { wmsLayerName } from './useLayerTreeItems';
import type { LayerTreeItem } from './useLayerTreeItems';

export interface UseLayerSwapDrag {
  move: (event: ItemMovedEvent) => void;
}

// Drag positions refer to the top-first tree, while the layer collection and
// WMS LAYERS lists are bottom-to-top. BEFORE and AFTER must therefore flip.
function toCollectionPosition(
  position: ItemMovedEvent['position'],
): ItemMovedEvent['position'] {
  return position ? -position : position;
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

export function useLayerSwapDrag(refreshItems: () => void): UseLayerSwapDrag {
  const app = inject<VcsUiApp>('vcsApp')!;

  function move(event: ItemMovedEvent): void {
    const item = event.item as LayerTreeItem;
    const targetItem = event.targetItem as LayerTreeItem;
    const layer = app.layers.getByKey(item.name);

    if (layer && !targetItem[vcsLayerName]) {
      moveItem(app.layers, {
        ...event,
        position: toCollectionPosition(event.position),
      });
    } else if (item[vcsLayerName] === targetItem[vcsLayerName]) {
      const wmsLayer = app.layers.getByKey(item[vcsLayerName]!);
      if (wmsLayer instanceof WMSLayer) {
        const newLayerNames = wmsLayer.getLayers();
        moveDraggableItems(newLayerNames as unknown as VcsDraggableItem[], {
          item: item[wmsLayerName] as unknown as VcsDraggableItem,
          targetItem: targetItem[wmsLayerName] as unknown as VcsDraggableItem,
          targetIndex: event.targetIndex,
          position: toCollectionPosition(event.position),
        });
        wmsLayer.setLayers(newLayerNames).catch((e: unknown) => {
          getLogger('LayerSwap.vue').error(String(e));
        });
      }
    }

    refreshItems();
  }

  return { move };
}
