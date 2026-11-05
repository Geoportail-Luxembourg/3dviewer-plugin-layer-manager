<script setup lang="ts">
  import { computed, getCurrentInstance, ref, useSlots, watch } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import { VBtn, VExpandTransition, VIcon, VRow } from 'vuetify/components';
  import {
    getForwardSlots,
    useFontSize,
    VcsActionButtonList,
    VcsTreeviewTitle,
  } from '@vcmap/ui';
  import type { DropZones, VcsTreeNodeItem } from '@vcmap/ui';
  import ImageElementInjector from './ImageElementInjector.vue';

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
    dragstart: [event: DragEvent, item: VcsTreeNodeItem];
    dragover: [
      event: DragEvent,
      item: VcsTreeNodeItem,
      dropTarget: HTMLElement,
      dropTargetZones?: DropZones,
      dropTargetOpen?: boolean,
    ];
    dragend: [event: DragEvent];
    drop: [event: DragEvent, item: VcsTreeNodeItem];
    dragleave: [event: DragEvent];
  }>();

  const instance = getCurrentInstance();
  const vm = instance!.proxy as unknown as { $t: (key: string) => string };
  const fontSize = useFontSize();
  const iconSize = computed(() => fontSize.value * (1.2 + 0.1 / 3));
  const slots = useSlots();
  const forwardSlots = getForwardSlots(slots);
  const treenodeRef = ref<ComponentPublicInstance | null>(null);
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

  function handleDragOver(event: DragEvent): void {
    const dropTarget = treenodeRef.value?.$el as HTMLElement | undefined;
    if (dropTarget) {
      emit('dragover', event, props.item, dropTarget, true, isOpen.value);
    }
  }

  function handleBottomDragOver(event: DragEvent): void {
    const dropTarget = treenodeRef.value?.$el as HTMLElement | undefined;
    if (dropTarget) {
      emit(
        'dragover',
        event,
        props.item,
        dropTarget,
        { before: false, into: false, after: true },
        false,
      );
    }
  }

  function bubbleItemToggled(name: string): void {
    emit('itemToggled', name);
  }

  function bubbleItemClicked(item: VcsTreeNodeItem, event: MouseEvent): void {
    emit('click', item, event);
  }

  function bubbleDragStart(event: DragEvent, item: VcsTreeNodeItem): void {
    emit('dragstart', event, item);
  }

  function bubbleDragOver(
    event: DragEvent,
    item: VcsTreeNodeItem,
    dropTarget: HTMLElement,
    dropTargetZones?: DropZones,
    dropTargetOpen?: boolean,
  ): void {
    emit('dragover', event, item, dropTarget, dropTargetZones, dropTargetOpen);
  }

  function bubbleDragEnd(event: DragEvent): void {
    emit('dragend', event);
  }

  function bubbleDrop(event: DragEvent, item: VcsTreeNodeItem): void {
    emit('drop', event, item);
  }

  function bubbleDragLeave(event: DragEvent): void {
    emit('dragleave', event);
  }
</script>

<template>
  <div
    v-if="matchFilter"
    class="vcs-tree-node"
    :data-tree-item-name="item.name"
    :draggable="draggable"
    @dragstart="emit('dragstart', $event, item)"
    @dragover="handleDragOver"
    @dragend="emit('dragend', $event)"
    @drop="emit('drop', $event, item)"
    @dragleave="emit('dragleave', $event)"
  >
    <v-row
      ref="treenodeRef"
      no-gutters
      class="treenode flex-nowrap text-truncate"
      :class="`level-${level} ${isGroup ? 'group' : 'item'}`"
    >
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
          class="col-4 pa-0 ml-auto pr-4"
        />
      </slot>
    </v-row>
    <v-expand-transition>
      <div v-if="isOpen && children.length">
        <div class="children">
          <CustomVcsTreeNode
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
            @dragstart="bubbleDragStart"
            @dragover="bubbleDragOver"
            @dragend="bubbleDragEnd"
            @drop="bubbleDrop"
            @dragleave="bubbleDragLeave"
          >
            <template v-for="slot of forwardSlots" #[slot]="scope">
              <slot :name="slot" v-bind="scope ?? {}" />
            </template>
          </CustomVcsTreeNode>
        </div>
        <div
          v-if="draggable"
          class="vcs-tree-node"
          @dragstart="emit('dragstart', $event, item)"
          @dragover="handleBottomDragOver"
          @dragend="emit('dragend', $event)"
          @drop="emit('drop', $event, item)"
          @dragleave="emit('dragleave', $event)"
        >
          <v-row
            no-gutters
            class="treenode-bottom-drop flex-nowrap text-truncate"
          ></v-row>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<style lang="scss" scoped>
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

  .treenode-bottom-drop {
    height: 5px;
  }

  .treenode,
  .treenode-bottom-drop {
    box-sizing: border-box;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
  }

  .drop-target-before > .treenode-bottom-drop,
  .drop-target-before > .treenode {
    border-top: 2px solid rgb(var(--v-theme-primary-lighten-1));
  }
  .drop-target-after > .treenode-bottom-drop,
  .drop-target-after > .treenode {
    border-bottom: 2px solid rgb(var(--v-theme-primary-darken-1));
  }

  .drop-target-into {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      outline: 2px dashed rgb(var(--v-theme-primary));
      background: rgba(var(--v-theme-primary), 0.1);
      pointer-events: none;
      z-index: 1;
    }
  }
</style>
