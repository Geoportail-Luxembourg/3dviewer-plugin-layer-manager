<script setup lang="ts">
  import { inject, ref } from 'vue';
  import { VSheet } from 'vuetify/components';
  import type { VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';
  import Treeview from './Treeview.vue';
  import { useLayerTreeItems } from '../composables/useLayerTreeItems';
  import { useLayerSwapDrag } from '../composables/useLayerSwapDrag';

  defineOptions({ name: 'VcsLayerSwap' });

  const app = inject<VcsUiApp>('vcsApp')!;
  const { items, refreshItems } = useLayerTreeItems();
  const { move } = useLayerSwapDrag(refreshItems);
  const expandedName = ref<string | null>(null);

  function toggleOptionsByName(name: string): void {
    if (!app.layers.getByKey(name)) {
      return;
    }

    expandedName.value = expandedName.value === name ? null : name;
  }

  function toggleOptions(item: VcsTreeNodeItem): void {
    toggleOptionsByName(item.name);
  }
</script>

<template>
  <div class="layer-tree">
    <Treeview
      v-if="items && items.length"
      :items="items"
      :expanded-name="expandedName"
      :show-searchbar="true"
      :sticky-searchbar="true"
      :draggable="true"
      open-all
      @item-moved="move"
      @options-toggled="toggleOptionsByName"
      @click="toggleOptions"
    />
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>
