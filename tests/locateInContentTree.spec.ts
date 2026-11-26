import { describe, it, expect } from 'vitest';
import type { ContentTreeItem, VcsUiApp } from '@vcmap/ui';
import {
  findContentTreeItem,
  getAncestorNames,
} from '../src/composables/useLocateInContentTree.js';

function createItem(
  name: string,
  config: Record<string, unknown>,
  visible = true,
): ContentTreeItem {
  return {
    name,
    visible,
    toJSON: () => config,
  } as unknown as ContentTreeItem;
}

function createApp(items: ContentTreeItem[]): VcsUiApp {
  return { contentTree: items } as unknown as VcsUiApp;
}

describe('useLocateInContentTree', () => {
  describe('getAncestorNames', () => {
    it('returns the namespace prefixes without the item itself', () => {
      expect(getAncestorNames('theme.group.layer')).toEqual([
        'theme',
        'theme.group',
      ]);
    });

    it('returns no ancestors for top level items', () => {
      expect(getAncestorNames('layer')).toEqual([]);
    });
  });

  describe('findContentTreeItem', () => {
    it('finds an item by layer name', () => {
      const target = createItem('theme.layer', { layerName: 'layer' });
      const app = createApp([
        createItem('other', { layerName: 'other' }),
        target,
      ]);

      expect(findContentTreeItem(app, 'layer')).toBe(target);
    });

    it('finds an item by layer names', () => {
      const target = createItem('group', {
        layerNames: ['one', 'two'],
      });
      const app = createApp([target]);

      expect(findContentTreeItem(app, 'two')).toBe(target);
    });

    it('prefers visible items', () => {
      const hidden = createItem('theme.hidden', { layerName: 'layer' }, false);
      const visible = createItem('theme.visible', { layerName: 'layer' });
      const app = createApp([hidden, visible]);

      expect(findContentTreeItem(app, 'layer')).toBe(visible);
    });

    it('returns undefined if no item matches', () => {
      const app = createApp([createItem('other', { layerName: 'other' })]);

      expect(findContentTreeItem(app, 'layer')).toBeUndefined();
    });
  });
});
