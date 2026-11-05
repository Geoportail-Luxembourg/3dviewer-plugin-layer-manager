import type { VcsPlugin, VcsUiApp, PluginConfigEditor } from '@vcmap/ui';
import { name, version, mapVersion } from '../package.json';
import { main } from './layer-manager';

type PluginConfig = object;
type PluginState = object;

type LayerManagerPlugin = VcsPlugin<PluginConfig, PluginState>;

export default function plugin(): LayerManagerPlugin {
  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    i18n: {
      en: {
        lux3dviewerPluginLayerManager: {
          components: {
            layerSwap: {
              hideButton: 'Hide layer',
              showButton: 'Show layer',
              opacity: 'Opacity',
              dragHandle: 'Drag to reorder',
            },
          },
        },
      },
      de: {
        lux3dviewerPluginLayerManager: {
          components: {
            layerSwap: {
              hideButton: 'Ebene ausblenden',
              showButton: 'Ebene einblenden',
              opacity: 'Deckkraft',
              dragHandle: 'Zum Verschieben ziehen',
            },
          },
        },
      },
    },
    initialize(vcsUiApp: VcsUiApp): void {
      main(vcsUiApp);
    },
    onVcsAppMounted(): void {},
    /**
     * should return all default values of the configuration
     */
    getDefaultOptions(): PluginConfig {
      return {};
    },
    /**
     * should return the plugin's serialization excluding all default values
     */
    toJSON(): PluginConfig {
      return {};
    },
    /**
     * should return the plugins state
     * @returns {PluginState}
     */
    getState(): PluginState {
      return {
        prop: '*',
      };
    },
    /**
     * components for configuring the plugin and/ or custom items defined by the plugin
     */
    getConfigEditors(): PluginConfigEditor<object>[] {
      return [];
    },
    destroy(): void {},
  };
}
