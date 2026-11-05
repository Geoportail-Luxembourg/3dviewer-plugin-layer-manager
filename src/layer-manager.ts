import { type VcsUiApp, ButtonLocation, createToggleAction } from '@vcmap/ui';
import LayerSwap from './components/CustomLayerSwap.vue';
import config from '../config.json';

export const goToOptions = {
  name: 'layer manager',
  title: 'layer manager',
  icon: '$vcsLayers',
};

export function main(app: VcsUiApp): void {
  const { action } = createToggleAction(
    {
      name: goToOptions.name,
      title: goToOptions.title,
      icon: goToOptions.icon,
    },
    {
      id: config.name,
      props: {},
      state: {
        headerTitle: goToOptions.name,
        headerIcon: goToOptions.icon,
      },
      position: {
        top: 0,
        left: 322,
      },
      component: LayerSwap,
    },
    app.windowManager,
    config.name,
  );

  app.navbarManager.add(
    { id: 'goto', action },
    config.name,
    ButtonLocation.CONTENT,
    { desktop: true, tablet: true, mobile: true },
  );
}
