import { computed, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import type {
  DropTargetZonesFunction,
  DropZones,
  ItemMovedEvent,
  VcsDraggableItem,
} from '@vcmap/ui';

export const insertMode = {
  BEFORE: -1,
  INTO: 0,
  AFTER: 1,
} as const;

interface DraggableProps {
  draggable: boolean;
  dropTargetZones?: DropTargetZonesFunction;
}

export interface DraggableListOrTreeSetup {
  dragging: Ref<boolean>;
  isDraggable: ComputedRef<boolean>;
  dragStart: (event: DragEvent, item: VcsDraggableItem) => void;
  dragOver: (
    event: DragEvent,
    item: VcsDraggableItem,
    dropTarget: HTMLElement,
    dropTargetZones?: DropZones,
    isOpen?: boolean,
  ) => void;
  dragEnd: (event: DragEvent) => void;
  drop: (event: DragEvent, item: VcsDraggableItem) => void;
}

export function setupDraggableListOrTree(
  props: DraggableProps,
  query: Ref<string>,
  emit: (event: 'itemMoved', value: ItemMovedEvent) => void,
): DraggableListOrTreeSetup {
  const dragging = ref(false);
  let draggedItem: VcsDraggableItem | null = null;
  let dropPosition: number | null = null;
  let lastDropTarget: HTMLElement | undefined;

  const isDraggable = computed(() => !query.value && props.draggable);

  function clearDropTargetClasses(target: HTMLElement): void {
    target.classList.remove(
      'drop-target-before',
      'drop-target-after',
      'drop-target-into',
      'no-drop-allowed',
    );
  }

  function addDropTargetClasses(
    event: DragEvent,
    dropTarget: HTMLElement,
    dropTargetZones: DropZones,
    isOpen: boolean,
  ): void {
    const { currentTarget, dataTransfer } = event;
    if (!dataTransfer || !(currentTarget instanceof HTMLElement)) {
      return;
    }

    const isAfterAllowed =
      Boolean(dropTargetZones) &&
      (typeof dropTargetZones !== 'object' || (dropTargetZones.after ?? true));
    const isBeforeAllowed =
      Boolean(dropTargetZones) &&
      (typeof dropTargetZones !== 'object' || (dropTargetZones.before ?? true));
    const isIntoAllowed =
      Boolean(dropTargetZones) &&
      (typeof dropTargetZones !== 'object' || Boolean(dropTargetZones.into));

    const denominator = isIntoAllowed ? 4 : 2;
    const rect = dropTarget.getBoundingClientRect();
    const threshold = rect.height / denominator;
    const relativeY = event.clientY - rect.top;

    dataTransfer.dropEffect = 'move';
    if (isBeforeAllowed && relativeY < threshold) {
      dropPosition = insertMode.BEFORE;
      currentTarget.classList.add('drop-target-before');
    } else if (
      isAfterAllowed &&
      relativeY >= (denominator - 1) * threshold &&
      !isOpen
    ) {
      dropPosition = insertMode.AFTER;
      currentTarget.classList.add('drop-target-after');
    } else if (isIntoAllowed) {
      dropPosition = insertMode.INTO;
      currentTarget.classList.add('drop-target-into');
      dataTransfer.dropEffect = 'copy';
    } else {
      dataTransfer.dropEffect = 'none';
    }
  }

  function drop(event: DragEvent, item: VcsDraggableItem): void {
    if (isDraggable.value) {
      if (draggedItem && item && draggedItem !== item) {
        emit('itemMoved', {
          item: draggedItem,
          targetItem: item,
          targetIndex: 0,
          position: dropPosition ?? undefined,
        });
      }
      draggedItem = null;
      dropPosition = null;
      dragging.value = false;
      if (event.currentTarget instanceof HTMLElement) {
        clearDropTargetClasses(event.currentTarget);
      }
    }
  }

  function dragStart(event: DragEvent, item: VcsDraggableItem): void {
    event.stopPropagation();
    if (isDraggable.value) {
      draggedItem = item;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'all';
      }
      dragging.value = true;
    }
  }

  function dragOver(
    event: DragEvent,
    item: VcsDraggableItem,
    dropTarget: HTMLElement,
    dropTargetZones: DropZones = true,
    isOpen = false,
  ): void {
    event.stopPropagation();
    event.preventDefault();
    if (
      (!isDraggable.value ||
        !dragging.value ||
        draggedItem?.name === item.name) &&
      event.dataTransfer
    ) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    if (lastDropTarget !== event.currentTarget) {
      if (lastDropTarget) {
        clearDropTargetClasses(lastDropTarget);
      }
      if (event.currentTarget instanceof HTMLElement) {
        lastDropTarget = event.currentTarget;
      }
    }

    if (!(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    clearDropTargetClasses(event.currentTarget);
    addDropTargetClasses(
      event,
      dropTarget,
      props.dropTargetZones
        ? props.dropTargetZones(draggedItem!, item)
        : dropTargetZones,
      isOpen,
    );
  }

  function dragEnd(event: DragEvent): void {
    event.stopPropagation();
    dropPosition = null;
    dragging.value = false;
    if (lastDropTarget) {
      clearDropTargetClasses(lastDropTarget);
      lastDropTarget = undefined;
    }
  }

  return {
    dragging,
    isDraggable,
    dragStart,
    dragOver,
    dragEnd,
    drop,
  };
}
