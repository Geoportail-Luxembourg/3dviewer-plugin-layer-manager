import { inject } from 'vue';
import type { ContentTreeItem, VcsUiApp } from '@vcmap/ui';
import { defaultContentTreeComponentId } from '@vcmap/ui';

const highlightClass = 'lux-locate-highlight';
const flashDuration = 1500;
const elementTimeout = 2000;

type LayerReference = {
  layerName?: string;
  layerNames?: string[];
};

const flashTimers = new WeakMap<HTMLElement, number>();

export function getAncestorNames(fullName: string): string[] {
  const parts = fullName.split('.');
  return parts
    .slice(0, -1)
    .map((_part, index) => parts.slice(0, index + 1).join('.'));
}

export function findContentTreeItem(
  app: VcsUiApp,
  layerName: string,
): ContentTreeItem | undefined {
  const matches = [...app.contentTree].filter((item) => {
    const config = item.toJSON() as LayerReference;
    return (
      config.layerName === layerName ||
      config.layerNames?.includes(layerName) === true
    );
  });

  return matches.find((item) => item.visible) ?? matches[0];
}

function getTreeId(app: VcsUiApp, itemName: string): string {
  const [root] = itemName.split('.');
  return app.contentTree.subTreeIds.includes(root)
    ? root
    : defaultContentTreeComponentId;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

async function waitFor<T>(
  query: () => T | null | undefined,
  timeout = elementTimeout,
): Promise<T | null> {
  const start = performance.now();

  const poll = async (): Promise<T | null> => {
    const result = query();
    if (result) {
      return result;
    }
    if (performance.now() - start >= timeout) {
      return null;
    }
    await nextFrame();
    return poll();
  };

  return poll();
}

function clearSearch(treeElement: HTMLElement): void {
  const input = treeElement.querySelector<HTMLInputElement>(
    '.vcs-treeview-searchbar input',
  );
  if (!input || input.value === '') {
    return;
  }

  input.value = '';
  input.dispatchEvent(new Event('input'));
}

function findRow(
  treeElement: HTMLElement,
  itemName: string,
): HTMLElement | null {
  const nodes = Array.from(
    treeElement.querySelectorAll<HTMLElement>('[data-tree-item-name]'),
  );
  const node = nodes.find(
    (element) => element.dataset.treeItemName === itemName,
  );
  if (!node) {
    return null;
  }

  return node.querySelector<HTMLElement>(':scope > .treenode');
}

function centerInTree(row: HTMLElement): void {
  const container = row.closest<HTMLElement>('.vcs-treeview');
  if (!container) {
    row.scrollIntoView({ block: 'center' });
    return;
  }

  const rowRect = row.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  container.scrollTop +=
    rowRect.top -
    containerRect.top -
    (container.clientHeight - rowRect.height) / 2;
}

function flashRow(row: HTMLElement): void {
  const runningTimer = flashTimers.get(row);
  if (runningTimer !== undefined) {
    window.clearTimeout(runningTimer);
  }

  row.classList.remove(highlightClass);
  row.getBoundingClientRect();
  row.classList.add(highlightClass);

  const timer = window.setTimeout(() => {
    row.classList.remove(highlightClass);
    flashTimers.delete(row);
  }, flashDuration);
  flashTimers.set(row, timer);
}

export function useLocateInContentTree(): (layerName: string) => Promise<void> {
  const app = inject<VcsUiApp>('vcsApp')!;

  return async (layerName: string): Promise<void> => {
    const item = findContentTreeItem(app, layerName);
    if (!item) {
      return;
    }

    const treeId = getTreeId(app, item.name);
    if (!app.windowManager.has(treeId)) {
      app.navbarManager.toggle(treeId, true);
    }

    const treeElement = await waitFor(() => {
      const windowElement = document.getElementById(
        `window-component--${treeId}`,
      );
      return windowElement?.querySelector<HTMLElement>('.vcs-treeview');
    });
    if (!treeElement) {
      return;
    }

    clearSearch(treeElement);
    await nextFrame();

    const openedItems = app.contentTree.getTreeOpenState(treeId);
    getAncestorNames(item.name).forEach((name) => {
      if (!openedItems.includes(name)) {
        openedItems.push(name);
      }
    });

    const row = await waitFor(() => findRow(treeElement, item.name));
    if (!row) {
      return;
    }

    centerInTree(row);
    flashRow(row);
  };
}
