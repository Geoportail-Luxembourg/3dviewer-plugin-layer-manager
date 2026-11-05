<script setup lang="ts">
  import { VSheet } from 'vuetify/components';
  import type { VcsTreeNodeItem } from '@vcmap/ui';
  import CustomVcsTreeview from './CustomVcsTreeview.vue';
  import { useLayerTreeItems } from '../composables/useLayerTreeItems';
  import { useLayerSwapDrag } from '../composables/useLayerSwapDrag';

  defineOptions({ name: 'VcsLayerSwap' });

  const { items, refreshItems } = useLayerTreeItems();
  const { dropTargetZones, move } = useLayerSwapDrag(items, refreshItems);
</script>

<template>
  <div class="layer-tree">
    <CustomVcsTreeview
      v-if="items && items.length"
      :items="items.reverse()"
      :show-searchbar="false"
      :draggable="true"
      open-all
      :drop-target-zones="dropTargetZones"
      @item-moved="move"
      @click="(item: VcsTreeNodeItem) => console.log('here: ' + item)"
    />
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>
