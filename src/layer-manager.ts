import {
  type VcsUiApp,
  ButtonLocation,
  createToggleAction,
  WindowSlot,
} from '@vcmap/ui';
import LayerSwap from './components/LayerSwap.vue';
import { name as pluginName } from '../package.json';

export const layerManagerOptions = {
  name: 'layerManager',
  title: 'lux3dviewerPluginLayerManager.layerManager.title',
  icon: '$vcsLayers',
};

export function main(app: VcsUiApp): void {
  const { action } = createToggleAction(
    {
      name: layerManagerOptions.name,
      title: layerManagerOptions.title,
      icon: layerManagerOptions.icon,
    },
    {
      id: pluginName,
      props: {},
      state: {
        headerTitle: layerManagerOptions.title,
        headerIcon: layerManagerOptions.icon,
      },
      slot: WindowSlot.DYNAMIC_LEFT,
      component: LayerSwap,
    },
    app.windowManager,
    pluginName,
  );

  app.navbarManager.add(
    { id: layerManagerOptions.name, action, weight: 0.5 },
    pluginName,
    ButtonLocation.CONTENT,
    { desktop: true, tablet: true, mobile: true },
  );
}
