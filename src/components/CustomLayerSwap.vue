<script setup lang="ts">
  import { VSheet } from 'vuetify/components';
  import { VcsTreeview } from '@vcmap/ui';
  import { useLayerTreeItems } from '../composables/useLayerTreeItems';
  import { useLayerSwapDrag } from '../composables/useLayerSwapDrag';

  defineOptions({ name: 'VcsLayerSwap' });

  const { items, refreshItems } = useLayerTreeItems();
  const { dropTargetZones, move } = useLayerSwapDrag(items, refreshItems);
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
