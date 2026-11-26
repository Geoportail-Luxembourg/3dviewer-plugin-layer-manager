<script setup lang="ts">
  import { computed, inject, ref, watch } from 'vue';
  import { TerrainLayer } from '@vcmap/core';
  import { VAlert, VBtn, VIcon } from 'vuetify/components';
  import { useFontSize, VcsSlider } from '@vcmap/ui';
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
  } from '../utils/layerOpacity';
  import { findContentTreeItem } from '../composables/useLocateInContentTree';

  const props = withDefaults(
    defineProps<{
      item: VcsTreeNodeItem;
      showSplit?: boolean;
      splitActive?: boolean;
    }>(),
    {
      showSplit: false,
      splitActive: false,
    },
  );

  const emit = defineEmits<{
    splitToggled: [];
    locate: [];
  }>();

  const app = inject<VcsUiApp>('vcsApp')!;
  const fontSize = useFontSize();
  const iconSize = computed(() => fontSize.value * (1.2 + 0.1 / 3));
  const layer = computed(() => app.layers.getByKey(props.item.name));
  const locatable = computed(
    () =>
      app.uiConfig.config.hideContentTree !== true &&
      !!findContentTreeItem(app, props.item.name),
  );

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

  function onSplitToggle(): void {
    emit('splitToggled');
  }

  function onLocate(): void {
    emit('locate');
  }
</script>

<template>
  <div class="flex flex-col items-center gap-2 px-3 py-1">
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
    <div class="opacity-row">
      <template v-if="opacityLayer || shaderLayer">
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
      </template>
      <div class="layer-actions ml-auto">
        <VBtn
          v-if="showSplit"
          icon
          class="split-toggle"
          :color="splitActive ? 'primary' : undefined"
          :title="
            $t(
              splitActive
                ? 'lux3dviewerPluginLayerManager.components.layerSwap.splitViewActiveButton'
                : 'lux3dviewerPluginLayerManager.components.layerSwap.splitViewButton',
            )
          "
          variant="text"
          @click.stop="onSplitToggle"
        >
          <VIcon :size="iconSize">$vcsSplitView</VIcon>
        </VBtn>
        <span
          :title="
            $t(
              locatable
                ? 'lux3dviewerPluginLayerManager.components.layerSwap.locateButton'
                : 'lux3dviewerPluginLayerManager.components.layerSwap.locateUnavailable',
            )
          "
        >
          <VBtn
            icon
            class="locate-toggle"
            :disabled="!locatable"
            variant="text"
            @click.stop="onLocate"
          >
            <VIcon :size="iconSize">mdi-crosshairs-gps</VIcon>
          </VBtn>
        </span>
      </div>
    </div>
    <VAlert
      v-if="!opacityLayer && !shaderLayer"
      type="info"
      variant="tonal"
      density="compact"
      class="w-100"
    >
      {{ $t(unsupportedMessageKey) }}
    </VAlert>
  </div>
</template>

<style scoped>
  .opacity-row {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 1rem;
  }

  .opaycity-slider {
    max-width: 100px;
  }

  .layer-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
</style>
