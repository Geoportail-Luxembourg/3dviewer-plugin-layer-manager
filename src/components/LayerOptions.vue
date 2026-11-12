<script setup lang="ts">
  import { computed, inject, ref, watch } from 'vue';
  import { TerrainLayer } from '@vcmap/core';
  import { VAlert, VBtn } from 'vuetify/components';
  import { VcsSlider } from '@vcmap/ui';
  import type { VcsTreeNodeItem, VcsUiApp } from '@vcmap/ui';
  import {
    getShaderOpacity,
    hasExternalCustomShader,
    isOpacityLayer,
    isShaderOpacityLayer,
    setLayerOpacity,
    setShaderOpacity,
    toggleLayerOpacity,
    toggleShaderOpacity,
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
  const shaderLayer = computed(() => {
    const activeLayer = layer.value;
    return activeLayer && isShaderOpacityLayer(activeLayer)
      ? activeLayer
      : null;
  });
  const shaderBlocked = computed(
    () => !!shaderLayer.value && hasExternalCustomShader(shaderLayer.value),
  );
  const unsupportedMessageKey = computed(() =>
    layer.value instanceof TerrainLayer
      ? 'lux3dviewerPluginLayerManager.components.layerSwap.opacityUnsupportedTerrain'
      : 'lux3dviewerPluginLayerManager.components.layerSwap.opacityUnsupported',
  );

  const opacity = ref(0);

  watch(
    () => ({ raster: opacityLayer.value, shader: shaderLayer.value }),
    () => {
      if (opacityLayer.value) {
        opacity.value = opacityLayer.value.opacity;
      } else if (shaderLayer.value) {
        opacity.value = getShaderOpacity(shaderLayer.value);
      } else {
        opacity.value = 0;
      }
    },
    { immediate: true },
  );

  const isHidden = computed(() => opacity.value === 0);

  function onOpacityChange(value: number | string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || shaderBlocked.value) {
      return;
    }

    if (opacityLayer.value) {
      setLayerOpacity(opacityLayer.value, parsed);
      opacity.value = opacityLayer.value.opacity;
    } else if (shaderLayer.value) {
      setShaderOpacity(shaderLayer.value, parsed);
      opacity.value = getShaderOpacity(shaderLayer.value);
    }
  }

  function onToggleOpacity(): void {
    if (shaderBlocked.value) {
      return;
    }

    if (opacityLayer.value) {
      toggleLayerOpacity(opacityLayer.value);
      opacity.value = opacityLayer.value.opacity;
    } else if (shaderLayer.value) {
      toggleShaderOpacity(shaderLayer.value);
      opacity.value = getShaderOpacity(shaderLayer.value);
    }
  }
</script>

<template>
  <div class="flex flex-col items-center gap-2 px-3 py-1 mr-2">
    <VAlert
      v-if="shaderBlocked"
      type="info"
      variant="tonal"
      density="compact"
      class="w-100"
    >
      {{
        $t(
          'lux3dviewerPluginLayerManager.components.layerSwap.customShaderBlocked',
        )
      }}
    </VAlert>
    <template v-if="opacityLayer || shaderLayer">
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
          :disabled="shaderBlocked"
          variant="text"
          @click.stop="onToggleOpacity"
        />
        <VcsSlider
          class="opaycity-slider"
          :model-value="opacity"
          :min="0"
          :max="1"
          :step="0.01"
          :disabled="shaderBlocked"
          @update:model-value="onOpacityChange"
        />
      </div>
    </template>
    <VAlert v-else type="info" variant="tonal" density="compact" class="w-100">
      {{ $t(unsupportedMessageKey) }}
    </VAlert>
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
