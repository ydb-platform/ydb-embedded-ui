import {StaffCard} from '../User/StaffCard';
import {AsideNavigation} from '../../containers/AsideNavigation/AsideNavigation';

import {ComponentsRegistryTemplate, Registry} from './registry';

const componentsRegistryInner = new Registry()
    .register('StaffCard', StaffCard)
    .register('AsideNavigation', AsideNavigation);

export type ComponentsRegistry = ComponentsRegistryTemplate<typeof componentsRegistryInner>;

export const componentsRegistry = componentsRegistryInner as ComponentsRegistry;
