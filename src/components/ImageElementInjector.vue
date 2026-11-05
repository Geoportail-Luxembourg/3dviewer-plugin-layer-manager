<script setup lang="ts">
  import { onMounted, ref } from 'vue';

  const props = defineProps<{
    element: HTMLCanvasElement | HTMLImageElement;
  }>();

  const container = ref<HTMLDivElement | null>(null);

  onMounted(() => {
    container.value?.replaceWith(props.element);
  });
</script>

<template>
  <div ref="container" />
</template>
