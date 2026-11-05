<template>
  <div
    class="vcs-treeview"
    :class="{ 'sticky-searchbar': stickySearchbar && showSearchbar }"
  >
    <CustomVcsTreeviewSearchbar
      v-if="showSearchbar"
      v-model="localSearchValue"
      :placeholder="searchbarPlaceholder"
    >
      <template #prepend>
        <slot name="search-prepend" />
      </template>
      <template #append="{ hasFilter }">
        <slot name="search-append" :has-filter="hasFilter" />
      </template>
    </CustomVcsTreeviewSearchbar>
    <div class="treeview-items">
      <div
        v-for="(item, index) in items"
        :key="item.name"
        class="vcs-treeitem"
        :class="{ 'mobile-spacing': xs }"
      >
        <CustomVcsTreeNode
          v-model:opened="localOpenedItems"
          class="root-node"
          :class="{
            'vcs-draggable-item': isDraggable,
          }"
          :item="item"
          :path="[index]"
          :search="localSearchValue"
          :custom-filter="customFilter"
          :open-on-click="openOnClick"
          :item-children="itemChildren"
          :draggable="isDraggable"
          @mousedown.shift="$event.preventDefault()"
          @dragstart="dragStart"
          @dragover="dragOver"
          @dragend="dragEnd"
          @drop="drop"
          @item-toggled="itemToggled"
          @click="handleItemClick"
        >
          <template v-for="slot of forwardSlots" #[slot]="scope">
            <slot :name="slot" v-bind="scope ?? {}" />
          </template>
        </CustomVcsTreeNode>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSlots, watch } from 'vue';
  import { useDisplay } from 'vuetify';
  import { getLogger } from '@vcsuite/logger';
  import { getForwardSlots } from '@vcmap/ui';
  import type {
    DropTargetZonesFunction,
    ItemMovedEvent,
    VcsTreeNodeItem,
  } from '@vcmap/ui';
  import CustomVcsTreeNode from './CustomVcsTreeNode.vue';
  import CustomVcsTreeviewSearchbar from './CustomVcsTreeviewSearchbar.vue';
  import { setupDraggableListOrTree } from '../composables/useTreeDrag';

  defineOptions({ name: 'VcsTreeview' });

  const props = withDefaults(
    defineProps<{
      items?: VcsTreeNodeItem[];
      itemChildren?: string;
      draggable?: boolean;
      openAll?: boolean;
      openOnClick?: boolean;
      showSearchbar?: boolean;
      stickySearchbar?: boolean;
      searchbarPlaceholder?: string;
      customFilter?: (
        item: VcsTreeNodeItem,
        search: string | undefined,
      ) => boolean;
      dropTargetZones?: DropTargetZonesFunction;
    }>(),
    {
      items: () => [],
      itemChildren: 'children',
      draggable: false,
      openAll: false,
      openOnClick: false,
      showSearchbar: false,
      stickySearchbar: false,
      searchbarPlaceholder: undefined,
      customFilter: undefined,
      dropTargetZones: undefined,
    },
  );

  const emit = defineEmits<{
    itemMoved: [event: ItemMovedEvent];
    click: [item: VcsTreeNodeItem];
  }>();

  const localSearchValue = defineModel<string>('search', { default: '' });
  const localOpenedItems = defineModel<string[]>('opened', {
    default: () => [],
  });

  const slots = useSlots();
  const forwardSlots = getForwardSlots(slots);

  watch(
    [(): VcsTreeNodeItem[] => props.items, (): boolean => props.openAll],
    () => {
      if (props.openAll) {
        const newItems = props.items
          .map((item) => item.name)
          .filter((name) => !localOpenedItems.value.includes(name));
        localOpenedItems.value.push(...newItems);
      }
    },
    { immediate: true },
  );

  function itemToggled(itemName: string): void {
    const idx = localOpenedItems.value.indexOf(itemName);
    if (idx >= 0) {
      localOpenedItems.value.splice(idx, 1);
    } else {
      localOpenedItems.value.push(itemName);
    }
  }

  const { xs } = useDisplay();

  const { isDraggable, dragStart, dragOver, dragEnd, drop } =
    setupDraggableListOrTree(props, localSearchValue, emit);

  function itemClicked(
    item: VcsTreeNodeItem | undefined,
    event: MouseEvent,
  ): void {
    if (item?.clickable) {
      const clicked = item.clicked as unknown as
        ((event: MouseEvent) => unknown) | undefined;
      if (clicked && !item.disabled) {
        const result = clicked(event);
        if (result instanceof Promise) {
          result.catch((e: unknown) => {
            getLogger('VcsTreeview.vue').error(
              `Tree view item failed to click ${item.name}`,
              e,
            );
          });
        }
      }
    } else if (props.openOnClick && !item?.disabled) {
      if (item) {
        itemToggled(item.name);
      }
    }
  }

  function handleItemClick(item: VcsTreeNodeItem, event: MouseEvent): void {
    itemClicked(item, event);
    emit('click', item);
  }
</script>

<style lang="scss" scoped>
  .vcs-treeview {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
  }

  .treeview-items {
    display: block;
  }
  .vcs-treeview.sticky-searchbar {
    --searchbar-height: calc(var(--v-vcs-font-size) * 2 + 18px);
    margin-top: var(--searchbar-height);

    > .vcs-treeview-searchbar {
      width: 100%;
      position: absolute !important;
      margin-top: calc(var(--searchbar-height) * -1);
      z-index: 2;
    }
  }
  // Hide node component when not rendered (e.g. filtered by search)
  .vcs-treeitem:not(:has(.vcs-tree-node)) {
    display: none;
  }
  .vcs-treeitem:not(:last-child) {
    border-bottom: 1px solid rgb(var(--v-theme-base-lighten-2));
  }
  :deep(
    .mobile-spacing
      > .vcs-tree-node
      > .children
      > .vcs-tree-node
      > .treenode
      > .vcs-action-button-list
      > button:not(:last-child)
  ) {
    margin-left: 10px !important;
    margin-right: 10px !important;
  }
  :deep(
    .mobile-spacing
      > .vcs-tree-node
      > .treenode
      > .vcs-action-button-list
      > button:not(:last-child)
  ) {
    margin-left: 10px !important;
    margin-right: 10px !important;
  }
  .root-node {
    :deep(.level-0) {
      // Root Level Entries should be 40px high
      min-height: calc(var(--v-vcs-font-size) * 2 + 14px) !important;
    }
    // Only Group Entries have a bold font
    > :deep(.group) {
      font-weight: 700 !important;
    }
  }
  .vcs-draggable-item:hover {
    cursor: grab;
    user-select: none;
  }
</style>
