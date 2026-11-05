<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useSortable } from '@vueuse/integrations/useSortable';
  import type { SortableEvent } from 'sortablejs';
  import type { TreeItemMove } from '../composables/treeSortable';

  const props = defineProps<{
    level: number;
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    itemMoved: [move: TreeItemMove];
  }>();

  const listRef = ref<HTMLElement | null>(null);

  function getItemName(element: Element | null | undefined): string | null {
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    return (
      element.dataset.treeItemName ??
      element.querySelector<HTMLElement>('[data-tree-item-name]')?.dataset
        .treeItemName ??
      null
    );
  }

  function onEnd(event: SortableEvent): void {
    const { oldIndex, newIndex, item, to } = event;
    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      oldIndex === newIndex
    ) {
      return;
    }

    const itemName = getItemName(item);
    const targetElement =
      to.children[oldIndex < newIndex ? newIndex - 1 : newIndex + 1];
    const targetName = getItemName(targetElement);
    if (!itemName || !targetName) {
      return;
    }

    emit('itemMoved', {
      itemName,
      targetName,
      position: oldIndex < newIndex ? 1 : -1,
    });
  }

  const { option } = useSortable(listRef, [], {
    animation: 150,
    handle: `.drag-handle-${props.level}`,
    forceFallback: true,
    fallbackOnBody: true,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    disabled: props.disabled ?? false,
    onUpdate: (): void => {},
    onEnd,
  });

  watch(
    () => props.disabled,
    (disabled) => {
      option('disabled', disabled ?? false);
    },
  );
</script>

<template>
  <div ref="listRef"><slot /></div>
</template>

<style lang="scss" scoped>
  :deep(.sortable-ghost) {
    opacity: 0.35;
  }
  :deep(.sortable-chosen) {
    background: rgb(var(--v-theme-base-lighten-3));
  }
</style>
