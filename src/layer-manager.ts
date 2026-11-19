import {
  type VcsUiApp,
  ButtonLocation,
  createToggleAction,
  WindowSlot,
} from '@vcmap/ui';
import LayerSwap from './components/LayerSwap.vue';
import config from '../config.json';

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
      id: config.name,
      props: {},
      state: {
        headerTitle: layerManagerOptions.title,
        headerIcon: layerManagerOptions.icon,
      },
      slot: WindowSlot.DYNAMIC_LEFT,
      component: LayerSwap,
    },
    app.windowManager,
    config.name,
  );

  app.navbarManager.add(
    { id: layerManagerOptions.name, action },
    config.name,
    ButtonLocation.CONTENT,
    { desktop: true, tablet: true, mobile: true },
  );
}
