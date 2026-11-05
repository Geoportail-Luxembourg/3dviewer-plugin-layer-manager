<script setup lang="ts">
  import { inject } from 'vue';
  import { VSheet } from 'vuetify/components';
  import type { VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';
  import CustomVcsTreeview from './CustomVcsTreeview.vue';
  import CustomLayerOptions from './CustomLayerOptions.vue';
  import nodeState from '../stores/node.store';
  import { useLayerTreeItems } from '../composables/useLayerTreeItems';
  import { useLayerSwapDrag } from '../composables/useLayerSwapDrag';

  defineOptions({ name: 'VcsLayerSwap' });

  const app = inject<VcsUiApp>('vcsApp')!;
  const { items, refreshItems } = useLayerTreeItems();
  const { dropTargetZones, move } = useLayerSwapDrag(items, refreshItems);

  function toggleOptions(item: VcsTreeNodeItem): void {
    if (!app.layers.getByKey(item.name)) {
      return;
    }

    nodeState.toggleExpandedNode(item.name);
  }
</script>

<template>
  <div class="layer-tree">
    <CustomVcsTreeview
      v-if="items && items.length"
      :items="items"
      :show-searchbar="false"
      :draggable="true"
      open-all
      :drop-target-zones="dropTargetZones"
      @item-moved="move"
      @click="toggleOptions"
    >
      <template #options="{ item }">
        <CustomLayerOptions
          v-if="nodeState.isExpanded(item.name)"
          :item="item"
        />
      </template>
    </CustomVcsTreeview>
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>
