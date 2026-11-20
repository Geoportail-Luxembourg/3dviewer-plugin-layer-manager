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
          layerManager: {
            title: 'Layer manager',
          },
          components: {
            layerSwap: {
              hideButton: 'Hide layer',
              showButton: 'Show layer',
              infoButton: 'Metadata',
              opacity: 'Opacity',
              dragHandle: 'Drag to reorder',
              optionsButton: 'Layer options',
              splitViewButton: 'Show split view',
              splitViewActiveButton: 'Hide split view',
              customShaderBlocked:
                'This layer already has a custom shader. Its opacity cannot be changed here.',
              opacityUnsupportedTerrain:
                'Terrain layers do not support opacity or split view.',
              opacityUnsupported:
                'Opacity is not supported for this layer type.',
            },
          },
        },
      },
      de: {
        lux3dviewerPluginLayerManager: {
          layerManager: {
            title: 'Ebenenmanager',
          },
          components: {
            layerSwap: {
              hideButton: 'Ebene ausblenden',
              showButton: 'Ebene einblenden',
              infoButton: 'Metadaten',
              opacity: 'Deckkraft',
              dragHandle: 'Zum Verschieben ziehen',
              optionsButton: 'Ebenenoptionen',
              splitViewButton: 'Geteilte Ansicht anzeigen',
              splitViewActiveButton: 'Geteilte Ansicht ausblenden',
              customShaderBlocked:
                'Diese Ebene verwendet bereits einen eigenen Shader. Die Deckkraft kann hier nicht geändert werden.',
              opacityUnsupportedTerrain:
                'Terrainebenen unterstützen weder Deckkraft noch geteilte Ansicht.',
              opacityUnsupported:
                'Deckkraft wird für diesen Ebenentyp nicht unterstützt.',
            },
          },
        },
      },
      fr: {
        lux3dviewerPluginLayerManager: {
          layerManager: {
            title: 'Gestionnaire de couches',
          },
          components: {
            layerSwap: {
              hideButton: 'Masquer la couche',
              showButton: 'Afficher la couche',
              infoButton: 'Métadonnées',
              opacity: 'Opacité',
              dragHandle: 'Glisser pour réorganiser',
              optionsButton: 'Options de la couche',
              splitViewButton: 'Afficher la vue partagée',
              splitViewActiveButton: 'Masquer la vue partagée',
              customShaderBlocked:
                'Cette couche utilise déjà un shader personnalisé. Son opacité ne peut pas être modifiée ici.',
              opacityUnsupportedTerrain:
                'Les couches de terrain ne prennent pas en charge l’opacité ni la vue partagée.',
              opacityUnsupported:
                'L’opacité n’est pas prise en charge pour ce type de couche.',
            },
          },
        },
      },
      lb: {
        lux3dviewerPluginLayerManager: {
          layerManager: {
            title: 'Schichtemanager',
          },
          components: {
            layerSwap: {
              hideButton: 'Schicht verstoppen',
              showButton: 'Schicht weisen',
              infoButton: 'Metadaten',
              opacity: 'Opazitéit',
              dragHandle: 'Zéien, fir d’Reiefolleg z’änneren',
              optionsButton: 'Schichtoptiounen',
              splitViewButton: 'Geteilte Vue weisen',
              splitViewActiveButton: 'Geteilte Vue verstoppen',
              customShaderBlocked:
                'Dës Schicht huet schonn ee personaliséierte Shader. D’Opazitéit kann hei net geännert ginn.',
              opacityUnsupportedTerrain:
                'Terrain-Schichte ginn net mat Opazitéit oder geteilter Vue ënnerstëtzt.',
              opacityUnsupported:
                'D’Opazitéit gëtt fir dësen Typ vu Schicht net ënnerstëtzt.',
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
