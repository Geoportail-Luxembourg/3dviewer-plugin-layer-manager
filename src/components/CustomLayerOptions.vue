<script setup lang="ts">
  import { computed, inject, ref, watch } from 'vue';
  import { VBtn } from 'vuetify/components';
  import { VcsSlider } from '@vcmap/ui';
  import type { VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';
  import {
    isOpacityLayer,
    setLayerOpacity,
    toggleLayerOpacity,
  } from '../composables/layerOpacity';

  const props = defineProps<{
    item: VcsTreeNodeItem;
  }>();

  const app = inject<VcsUiApp>('vcsApp')!;
  const layer = computed(() => app.layers.getByKey(props.item.name));
  const opacityLayer = computed(() => {
    const activeLayer = layer.value;
    return activeLayer && isOpacityLayer(activeLayer) ? activeLayer : null;
  });
  const opacity = ref(0);

  watch(
    opacityLayer,
    (activeLayer) => {
      opacity.value = activeLayer?.opacity ?? 0;
    },
    { immediate: true },
  );

  const isHidden = computed(() => !!opacityLayer.value && opacity.value === 0);

  function onOpacityChange(value: number | string): void {
    const parsed = Number(value);
    if (!opacityLayer.value || !Number.isFinite(parsed)) {
      return;
    }

    setLayerOpacity(opacityLayer.value, parsed);
    opacity.value = opacityLayer.value.opacity;
  }

  function onToggleOpacity(): void {
    if (!opacityLayer.value) {
      return;
    }

    toggleLayerOpacity(opacityLayer.value);
    opacity.value = opacityLayer.value.opacity;
  }
</script>

<template>
  <div class="flex flex-col items-center gap-2 px-3 py-1 mr-2">
    <template v-if="opacityLayer">
      <div class="opacity-row">
        <VBtn
          :icon="isHidden ? 'mdi-eye-off' : 'mdi-eye'"
          :title="
            $t(
              isHidden
                ? 'lux3dviewerPluginLayerManager.components.layerSwap.showButton'
                : 'lux3dviewerPluginLayerManager.components.layerSwap.hideButton',
            )
          "
          variant="text"
          @click.stop="onToggleOpacity"
        />
        <VcsSlider
          class="opaycity-slider"
          :model-value="opacity"
          :min="0"
          :max="1"
          :step="0.01"
          @update:model-value="onOpacityChange"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
  .opacity-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .opaycity-slider {
    max-width: 100px;
  }
</style>
