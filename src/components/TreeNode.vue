<script setup lang="ts">
  import { computed, getCurrentInstance, ref, useSlots, watch } from 'vue';
  import { VBtn, VExpandTransition, VIcon, VRow } from 'vuetify/components';
  import {
    getForwardSlots,
    useFontSize,
    VcsActionButtonList,
    VcsTreeviewTitle,
  } from '@vcmap/ui';
  import type { ItemMovedEvent, VcsTreeNodeItem } from '@vcmap/ui';
  import SortableList from './SortableList.vue';
  import ImageElementInjector from './ImageElementInjector.vue';
  import type { TreeItemMove } from '../composables/treeSortable';

  defineOptions({ name: 'VcsTreeNode' });

  const props = withDefaults(
    defineProps<{
      item: VcsTreeNodeItem;
      itemChildren?: string;
      draggable?: boolean;
      level?: number;
      opened: string[];
      openOnClick?: boolean;
      search?: string;
      customFilter?: (
        item: VcsTreeNodeItem,
        search: string | undefined,
      ) => boolean;
      showAllChildren?: boolean;
    }>(),
    {
      itemChildren: 'children',
      draggable: false,
      level: 0,
      openOnClick: false,
      search: undefined,
      customFilter: undefined,
      showAllChildren: false,
    },
  );

  const emit = defineEmits<{
    itemToggled: [name: string];
    click: [item: VcsTreeNodeItem, event: MouseEvent];
    itemMoved: [event: ItemMovedEvent];
  }>();

  const instance = getCurrentInstance();
  const vm = instance!.proxy as unknown as { $t: (key: string) => string };
  const fontSize = useFontSize();
  const iconSize = computed(() => fontSize.value * (1.2 + 0.1 / 3));
  const slots = useSlots();
  const forwardSlots = getForwardSlots(slots);
  const searchOpenOverride = ref<boolean | undefined>(undefined);

  const children = computed(
    () =>
      (props.item as unknown as Record<string, VcsTreeNodeItem[] | undefined>)[
        props.itemChildren
      ] ?? [],
  );

  function translatedTitle(item: VcsTreeNodeItem): string {
    return item.title ? vm.$t(item.title) : item.name;
  }

  function doesItemMatch(item: VcsTreeNodeItem): boolean {
    if (!props.search) {
      return true;
    }

    if (props.customFilter) {
      return props.customFilter(item, props.search);
    }

    return (
      translatedTitle(item)
        .toLocaleLowerCase()
        .indexOf(props.search.toLocaleLowerCase()) > -1
    );
  }

  function doesDescendantMatch(item: VcsTreeNodeItem): boolean {
    const itemChildren = (
      item as unknown as Record<string, VcsTreeNodeItem[] | undefined>
    )[props.itemChildren];
    return (
      itemChildren?.some(
        (child) => doesItemMatch(child) || doesDescendantMatch(child),
      ) ?? false
    );
  }

  const matchesSelf = computed(() => doesItemMatch(props.item));
  const hasDescendantMatch = computed(() => doesDescendantMatch(props.item));

  const matchFilter = computed(() => {
    if (!props.search || props.showAllChildren) {
      return true;
    }

    return matchesSelf.value || hasDescendantMatch.value;
  });

  const searchOpen = computed(
    () => searchOpenOverride.value ?? hasDescendantMatch.value,
  );

  const isOpen = computed(
    () =>
      children.value.length > 0 &&
      (props.search
        ? searchOpen.value
        : props.opened.includes(props.item.name)),
  );

  const isGroup = computed(
    () => children.value.length > 0 || props.item.forceNodeDisplay,
  );

  watch(
    () => props.search,
    () => {
      searchOpenOverride.value = undefined;
    },
  );

  function toggleCurrentItem(): void {
    if (props.search) {
      searchOpenOverride.value = !isOpen.value;
      return;
    }

    emit('itemToggled', props.item.name);
  }

  function handleTitleClick(event: MouseEvent): void {
    emit('click', props.item, event);

    if (
      props.search &&
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
</script>

<template>
  <div
    v-if="matchFilter"
    class="vcs-tree-node"
    :class="level > 0 ? `sortable-level-${level}` : undefined"
    :data-tree-item-name="item.name"
  >
    <v-row
      no-gutters
      class="treenode flex-nowrap text-truncate"
      :class="`level-${level} ${isGroup ? 'group' : 'item'}`"
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
        v-if="isGroup"
        class="chevron-btn"
        variant="text"
        :disabled="children.length === 0"
        :icon="isOpen ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        @click="toggleCurrentItem"
      />
      <slot name="prepend" v-bind="{ item }">
        <span
          class="prepend"
          :class="{
            'text-disabled': item.disabled,
          }"
        >
          <div v-if="item.icon">
            <v-icon v-if="typeof item?.icon === 'string'" :size="iconSize">
              {{ item.icon }}
            </v-icon>
            <ImageElementInjector v-else :element="item.icon" />
          </div>
        </span>
      </slot>
      <slot name="title" v-bind="{ item }">
        <VcsTreeviewTitle
          :item="item"
          :cursor-pointer="item.clickable || (openOnClick && isGroup)"
          @click="handleTitleClick"
        />
      </slot>
      <slot name="append" v-bind="{ item }">
        <VcsActionButtonList
          v-if="item.actions && item.actions.length > 0"
          :actions="item.actions"
          :overflow-count="3"
          :disabled="item.disabled"
          right
          tooltip-position="right"
          :block-overflow="item.blockOverflow ?? true"
        />
      </slot>
    </v-row>
    <slot name="options" v-bind="{ item }" />
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
          :search="search"
          :custom-filter="customFilter"
          :show-all-children="
            showAllChildren || (isGroup && matchesSelf && !hasDescendantMatch)
          "
          :level="level + 1"
          :open-on-click="openOnClick"
          :item-children="itemChildren"
          :opened="opened"
          :draggable="draggable"
          @item-toggled="bubbleItemToggled"
          @click="bubbleItemClicked"
          @item-moved="bubbleItemMoved"
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
  }
  @for $i from 0 through 6 {
    .level-#{$i} {
      margin-left: calc(var(--v-vcs-font-size) * $i + 2px);
      &.item {
        & > .prepend:not(:has(.v-icon)) {
          margin-left: calc(var(--v-vcs-font-size) * 2);
        }
        & > .prepend:has(.v-icon) {
          margin-left: 4px;
        }
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
    width: var(--v-vcs-font-size);
    height: var(--v-vcs-font-size);
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
