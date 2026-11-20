<script setup lang="ts">
  import { computed, useSlots } from 'vue';
  import { VBtn, VExpandTransition, VIcon, VRow } from 'vuetify/components';
  import {
    getForwardSlots,
    useFontSize,
    VcsActionButtonList,
    VcsTreeviewTitle,
  } from '@vcmap/ui';
  import type { ItemMovedEvent, VcsTreeNodeItem } from '@vcmap/ui';
  import SortableList from './SortableList.vue';
  import LayerOptions from './LayerOptions.vue';
  import type { LayerTreeItem } from '../composables/useLayerTreeItems';
  import type { TreeItemMove } from '../models/treeItemMove';

  defineOptions({ name: 'VcsTreeNode' });

  const props = withDefaults(
    defineProps<{
      item: VcsTreeNodeItem;
      itemChildren?: string;
      draggable?: boolean;
      level?: number;
      expandedName?: string | null;
      opened: string[];
      openOnClick?: boolean;
      splitLayerName?: string | null;
      splitActive?: boolean;
    }>(),
    {
      itemChildren: 'children',
      draggable: false,
      level: 0,
      expandedName: undefined,
      openOnClick: false,
      splitLayerName: undefined,
      splitActive: false,
    },
  );

  const emit = defineEmits<{
    itemToggled: [name: string];
    click: [item: VcsTreeNodeItem, event: MouseEvent];
    itemMoved: [event: ItemMovedEvent];
    optionsToggled: [name: string];
    splitToggled: [name: string];
  }>();

  const fontSize = useFontSize();
  const iconSize = computed(() => fontSize.value * (1.2 + 0.1 / 3));
  const infoAction = computed(() => (props.item as LayerTreeItem).infoAction);
  const slots = useSlots();
  const forwardSlots = getForwardSlots(slots);

  const children = computed(
    () =>
      (props.item as unknown as Record<string, VcsTreeNodeItem[] | undefined>)[
        props.itemChildren
      ] ?? [],
  );

  const isOpen = computed(
    () => children.value.length > 0 && props.opened.includes(props.item.name),
  );

  const isGroup = computed(
    () => children.value.length > 0 || props.item.forceNodeDisplay,
  );

  const showSplitToggle = computed(
    () =>
      props.level === 0 &&
      props.splitLayerName !== undefined &&
      props.item.name === props.splitLayerName,
  );

  function toggleCurrentItem(): void {
    emit('itemToggled', props.item.name);
  }

  function handleTitleClick(event: MouseEvent): void {
    emit('click', props.item, event);

    if (
      !props.item?.clickable &&
      props.openOnClick &&
      !props.item?.disabled &&
      (children.value.length > 0 || props.item.forceNodeDisplay)
    ) {
      toggleCurrentItem();
    }
  }

  function bubbleItemToggled(name: string): void {
    emit('itemToggled', name);
  }

  function bubbleItemClicked(item: VcsTreeNodeItem, event: MouseEvent): void {
    emit('click', item, event);
  }

  function bubbleItemMoved(event: ItemMovedEvent): void {
    emit('itemMoved', event);
  }

  function handleChildItemMoved(move: TreeItemMove): void {
    const item = children.value.find((i) => i.name === move.itemName);
    const targetItem = children.value.find((i) => i.name === move.targetName);
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

  function handleOptionsToggle(): void {
    emit('optionsToggled', props.item.name);
  }

  function handleSplitToggle(): void {
    emit('splitToggled', props.item.name);
  }

  function bubbleOptionsToggled(name: string): void {
    emit('optionsToggled', name);
  }
</script>

<template>
  <div
    class="vcs-tree-node"
    :class="level > 0 ? `sortable-level-${level}` : undefined"
    :data-tree-item-name="item.name"
  >
    <v-row
      no-gutters
      class="treenode flex-nowrap text-truncate"
      :class="`level-${level} ${isGroup ? 'group' : 'item'}`"
      :style="{ '--tree-level': String(level) }"
    >
      <VBtn
        v-if="draggable"
        :class="`drag-handle drag-handle-${level} mx-1`"
        icon="mdi-menu"
        :title="
          $t('lux3dviewerPluginLayerManager.components.layerSwap.dragHandle')
        "
        variant="text"
        @click.stop
      />
      <VBtn
        v-if="infoAction"
        icon
        class="info-action ml-2 mr-2"
        :title="infoAction.title ? $t(infoAction.title) : undefined"
        variant="text"
        @click.stop="infoAction.callback($event)"
      >
        <VIcon :size="iconSize">{{ infoAction.icon }}</VIcon>
      </VBtn>
      <VBtn v-else icon class="info-action ml-2 mr-2" variant="text" disabled />
      <VBtn
        v-if="isGroup"
        class="chevron-btn"
        variant="text"
        :disabled="children.length === 0"
        :icon="isOpen ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        @click="toggleCurrentItem"
      />
      <slot name="prepend" v-bind="{ item }">
        <span
          v-if="typeof item?.icon === 'string'"
          class="prepend"
          :class="{
            'text-disabled': item.disabled,
          }"
        >
          <v-icon :size="iconSize">
            {{ item.icon }}
          </v-icon>
        </span>
      </slot>
      <slot name="title" v-bind="{ item }">
        <VcsTreeviewTitle
          :item="item"
          :cursor-pointer="item.clickable || (openOnClick && isGroup)"
          @click="handleTitleClick"
        />
      </slot>
      <VBtn
        v-if="level === 0"
        icon
        class="options-toggle ml-1"
        :title="
          $t('lux3dviewerPluginLayerManager.components.layerSwap.optionsButton')
        "
        variant="text"
        @click.stop="handleOptionsToggle"
      >
        <VIcon :size="iconSize">
          {{ expandedName === item.name ? 'mdi-close' : '$vcsKebab' }}
        </VIcon>
      </VBtn>
      <slot name="append" v-bind="{ item }">
        <VcsActionButtonList
          v-if="item.actions && item.actions.length > 0"
          class="ml-1"
          :actions="item.actions"
          :overflow-count="3"
          :disabled="item.disabled"
          right
          tooltip-position="right"
          :block-overflow="item.blockOverflow ?? true"
        />
      </slot>
    </v-row>
    <slot name="options" v-bind="{ item }">
      <LayerOptions
        v-if="expandedName === item.name"
        :item="item"
        :show-split="showSplitToggle"
        :split-active="splitActive"
        @split-toggled="handleSplitToggle"
      />
    </slot>
    <v-expand-transition>
      <SortableList
        v-if="isOpen && children.length"
        class="children"
        :level="level + 1"
        :disabled="!draggable"
        @item-moved="handleChildItemMoved"
      >
        <TreeNode
          v-for="child in children"
          :key="child.name"
          :item="child"
          :level="level + 1"
          :expanded-name="expandedName"
          :open-on-click="openOnClick"
          :item-children="itemChildren"
          :opened="opened"
          :draggable="draggable"
          @item-toggled="bubbleItemToggled"
          @click="bubbleItemClicked"
          @item-moved="bubbleItemMoved"
          @options-toggled="bubbleOptionsToggled"
        >
          <template v-for="slot of forwardSlots" #[slot]="scope">
            <slot :name="slot" v-bind="scope ?? {}" />
          </template>
        </TreeNode>
      </SortableList>
    </v-expand-transition>
  </div>
</template>

<style lang="scss" scoped>
  :deep(.title-parent.vcs-treeview-title) {
    cursor: pointer;
  }

  .treenode {
    align-items: center !important;
    min-height: calc(var(--v-vcs-font-size) * 2 + 6px);
    margin-left: calc(var(--v-vcs-font-size) * var(--tree-level, 0) + 2px);
    &.item {
      & > .prepend:has(.v-icon) {
        margin-left: 4px;
      }
    }
  }
  .prepend {
    :deep(.v-icon) {
      margin-right: 6px;
      display: flex;
      align-items: start;
    }
  }
  // Indent children padding
  .children {
    padding-left: var(--v-vcs-font-size);
  }
  // set the size of the buttons, except for the ActionButtonList
  :deep(.v-btn):not(.vcs-button) {
    width: calc(var(--v-vcs-font-size) * 1.25);
    height: calc(var(--v-vcs-font-size) * 1.5);
    // for alignment of chevron
    display: flex;
    &.chevron-btn {
      margin-left: 4px;
      margin-right: 8px;
      > span > i {
        font-size: calc(var(--v-icon-size-multiplier) * 1.25em);
      }
    }
  }
  :deep(.v-btn .v-icon svg) {
    overflow: visible;
  }
  // remove hover shadow over button
  :deep(.v-btn__overlay) {
    --v-hover-opacity: 0;
  }

  .drag-handle {
    cursor: grab;
  }

  .treenode {
    box-sizing: border-box;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
  }

  :deep(.vcs-action-button-list .v-spacer) {
    width: 0;
  }
</style>
