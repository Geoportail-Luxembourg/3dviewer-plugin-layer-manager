<script setup lang="ts">
  import { computed, inject, ref, watch } from 'vue';
  import { VSheet } from 'vuetify/components';
  import type { VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';
  import Treeview from './Treeview.vue';
  import { useLayerTreeItems } from '../composables/useLayerTreeItems';
  import { useLayerSwapDrag } from '../composables/useLayerSwapDrag';
  import { useLayerSplitView } from '../composables/useLayerSplitView';

  defineOptions({ name: 'VcsLayerSwap' });

  const app = inject<VcsUiApp>('vcsApp')!;
  const { items, refreshItems } = useLayerTreeItems();
  const { move } = useLayerSwapDrag(refreshItems);
  const { activeLayerName, canSplit, toggle, updateActiveLayer, stop } =
    useLayerSplitView();
  const expandedName = ref<string | null>(null);
  const topLayerName = computed(() => items.value[0]?.name ?? null);
  const splitLayerName = computed(() =>
    canSplit(topLayerName.value) ? topLayerName.value : null,
  );
  const splitActive = computed(
    () =>
      splitLayerName.value !== null &&
      activeLayerName.value === splitLayerName.value,
  );

  watch(splitLayerName, (layerName) => {
    if (!activeLayerName.value || activeLayerName.value === layerName) {
      return;
    }

    if (layerName) {
      updateActiveLayer(layerName);
    } else {
      stop();
    }
  });

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
      :split-layer-name="splitLayerName"
      :split-active="splitActive"
      :draggable="true"
      open-all
      @item-moved="move"
      @options-toggled="toggleOptionsByName"
      @split-toggled="toggle"
      @click="toggleOptions"
    />
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>

<style lang="scss">
  .vcm-layer-split-element {
    width: 5px;
    background-color: rgb(var(--v-theme-primary));
    touch-action: none;
    vertical-align: middle;

    &:hover {
      cursor: ew-resize;
    }

    &:before {
      position: absolute;
      top: 48%;
      right: calc(-1 * (var(--v-vcs-font-size) * 0.7875));
      content: '';
      background-color: rgb(var(--v-theme-primary));
      border-radius: 50%;
      width: calc((var(--v-vcs-font-size) * 2) - 2px);
      height: calc((var(--v-vcs-font-size) * 2) - 2px);
    }
  }

  .vcm-layer-split-element-handle {
    position: absolute;
    top: 48%;
    left: calc(-1 * ((var(--v-vcs-font-size) * 2) * 0.625 - 7px));
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--v-vcs-font-size) * 2 - 2px);
    height: calc(var(--v-vcs-font-size) * 2 - 2px);
    border-radius: 50%;
    background-color: rgb(var(--v-theme-base-lighten-5));
    color: rgb(var(--v-theme-primary));
    font-size: calc(var(--v-vcs-font-size) * 1.25);
    pointer-events: none;

    &.mdi:before {
      font-size: inherit;
    }
  }

  .vcm-layer-split-element-title {
    position: absolute;
    right: 3px;
    bottom: 3px;
    z-index: 9999;
    color: rgb(var(--v-theme-base-lighten-5));
    white-space: nowrap;
    padding: 5px;
    background-color: rgb(var(--v-theme-primary));
    border-bottom-left-radius: 4px 4px;
    border-top-left-radius: 4px 4px;
    pointer-events: none;
  }
</style>
