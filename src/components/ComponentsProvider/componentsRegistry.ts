import {StaffCard} from '../User/StaffCard';
import {AsideNavigation} from '../../containers/AsideNavigation/AsideNavigation';

import {ComponentsRegistryTemplate, Registry} from './registry';
import {ErrorBoundaryInner} from '../ErrorBoundary/ErrorBoundary';

const componentsRegistryInner = new Registry()
    .register('StaffCard', StaffCard)
    .register('AsideNavigation', AsideNavigation)
    .register('ErrorBoundary', ErrorBoundaryInner);

export type ComponentsRegistry = ComponentsRegistryTemplate<typeof componentsRegistryInner>;

export const componentsRegistry = componentsRegistryInner as ComponentsRegistry;
