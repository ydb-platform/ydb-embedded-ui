import {StaffCard} from '../User/StaffCard';
import {AsideNavigation} from '../../containers/AsideNavigation/AsideNavigation';

import {ComponentsRegistry, Registry} from './registry';

const componentsRegistryInner = new Registry()
    .register('StaffCard', StaffCard)
    .register('AsideNavigation', AsideNavigation);

export type YdbComponentsRegistry = ComponentsRegistry<typeof componentsRegistryInner>;

export const ydbComponentsRegistry = componentsRegistryInner as YdbComponentsRegistry;
