import {AsideNavigation} from '../../containers/AsideNavigation/AsideNavigation';
import {ErrorBoundaryInner} from '../ErrorBoundary/ErrorBoundary';
import {ShardsTable} from '../ShardsTable/ShardsTable';
import {StaffCard} from '../User/StaffCard';

import type {ComponentsRegistryTemplate} from './registry';
import {Registry} from './registry';

const AnyPlaceholder = () => null;

const componentsRegistryInner = new Registry()
    .register('StaffCard', StaffCard)
    .register('AsideNavigation', AsideNavigation)
    .register('ErrorBoundary', ErrorBoundaryInner)
    .register('ShardsTable', ShardsTable)
    .register('AIAssistantButton', AnyPlaceholder)
    .register('ChatPanel', AnyPlaceholder);

export type ComponentsRegistry = ComponentsRegistryTemplate<typeof componentsRegistryInner>;

export const componentsRegistry = componentsRegistryInner as ComponentsRegistry;
