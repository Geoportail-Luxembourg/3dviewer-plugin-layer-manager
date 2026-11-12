<script setup lang="ts">
  import { inject } from 'vue';
  import { VSheet } from 'vuetify/components';
  import type { VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';
  import Treeview from './Treeview.vue';
  import LayerOptions from './LayerOptions.vue';
  import nodeState from '../stores/node.store';
  import { useLayerTreeItems } from '../composables/useLayerTreeItems';
  import { useLayerSwapDrag } from '../composables/useLayerSwapDrag';

  defineOptions({ name: 'VcsLayerSwap' });

  const app = inject<VcsUiApp>('vcsApp')!;
  const { items, refreshItems } = useLayerTreeItems();
  const { move } = useLayerSwapDrag(refreshItems);

  function toggleOptions(item: VcsTreeNodeItem): void {
    if (!app.layers.getByKey(item.name)) {
      return;
    }

    nodeState.toggleExpandedNode(item.name);
  }
</script>

<template>
  <div class="layer-tree">
    <Treeview
      v-if="items && items.length"
      :items="items"
      :show-searchbar="false"
      :draggable="true"
      open-all
      @item-moved="move"
      @click="toggleOptions"
    >
      <template #options="{ item }">
        <LayerOptions v-if="nodeState.isExpanded(item.name)" :item="item" />
      </template>
    </Treeview>
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>
