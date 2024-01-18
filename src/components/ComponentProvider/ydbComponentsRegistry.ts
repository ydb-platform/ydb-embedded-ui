import {StaffCard} from '../User/StaffCard';
import {AsideNavigation} from '../../containers/AsideNavigation/AsideNavigation';

import {ComponentRegistry, Registry} from './registry';

const componentRegistryInner = new Registry()
    .register('StaffCard', StaffCard)
    .register('AsideNavigation', AsideNavigation);

export type YdbComponentsRegistry = ComponentRegistry<typeof componentRegistryInner>;

export const ydbComponentsRegistry = componentRegistryInner as YdbComponentsRegistry;
