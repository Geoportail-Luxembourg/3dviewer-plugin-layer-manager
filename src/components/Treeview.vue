<script setup lang="ts">
  import { useSlots, watch } from 'vue';
  import { useDisplay } from 'vuetify';
  import { getLogger } from '@vcsuite/logger';
  import { getForwardSlots } from '@vcmap/ui';
  import type { ItemMovedEvent, VcsTreeNodeItem } from '@vcmap/ui';
  import SortableList from './SortableList.vue';
  import TreeNode from './TreeNode.vue';
  import type { TreeItemMove } from '../models/treeItemMove';

  defineOptions({ name: 'VcsTreeview' });

  const props = withDefaults(
    defineProps<{
      items?: VcsTreeNodeItem[];
      itemChildren?: string;
      draggable?: boolean;
      openAll?: boolean;
      openOnClick?: boolean;
      expandedName?: string | null;
    }>(),
    {
      items: () => [],
      itemChildren: 'children',
      draggable: false,
      openAll: false,
      openOnClick: false,
      expandedName: undefined,
    },
  );

  const emit = defineEmits<{
    itemMoved: [event: ItemMovedEvent];
    click: [item: VcsTreeNodeItem];
    optionsToggled: [name: string];
  }>();

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

  function handleRootItemMoved(move: TreeItemMove): void {
    const item = props.items.find((i) => i.name === move.itemName);
    const targetItem = props.items.find((i) => i.name === move.targetName);
    if (!item || !targetItem) {
      return;
    }

    emit('itemMoved', {
      item,
      targetItem,
      targetIndex: 0,
      position: move.position,
    });
  }

  function handleNodeItemMoved(event: ItemMovedEvent): void {
    emit('itemMoved', event);
  }

  function handleOptionsToggled(name: string): void {
    emit('optionsToggled', name);
  }

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

<template>
  <div class="vcs-treeview">
    <SortableList
      class="treeview-items"
      :level="0"
      :disabled="!draggable"
      @item-moved="handleRootItemMoved"
    >
      <div
        v-for="(item, index) in items"
        :key="item.name"
        class="vcs-treeitem sortable-level-0"
        :class="{ 'mobile-spacing': xs }"
      >
        <TreeNode
          v-model:opened="localOpenedItems"
          class="root-node"
          :item="item"
          :path="[index]"
          :open-on-click="openOnClick"
          :item-children="itemChildren"
          :expanded-name="expandedName"
          :draggable="draggable"
          @mousedown.shift="$event.preventDefault()"
          @item-toggled="itemToggled"
          @item-moved="handleNodeItemMoved"
          @options-toggled="handleOptionsToggled"
          @click="handleItemClick"
        >
          <template v-for="slot of forwardSlots" #[slot]="scope">
            <slot :name="slot" v-bind="scope ?? {}" />
          </template>
        </TreeNode>
      </div>
    </SortableList>
  </div>
</template>

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
</style>
