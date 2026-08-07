import {AsideNavigation} from '../../containers/AsideNavigation/AsideNavigation';
import type {HealthcheckAssistantActionProps} from '../../containers/Tenant/Healthcheck/types';
import {ErrorBoundaryInner} from '../ErrorBoundary/ErrorBoundary';
import {ShardsTable} from '../ShardsTable/ShardsTable';
import {StaffCard} from '../User/StaffCard';

import type {ComponentsRegistryTemplate} from './registry';
import {Registry} from './registry';

const EmptyChatPanel = function EmptyPlaceholder() {
    return null;
};
const EmptyHealthcheckAssistantAction = function EmptyPlaceholder(
    _props: HealthcheckAssistantActionProps,
) {
    return null;
};

const componentsRegistryInner = new Registry()
    .register('StaffCard', StaffCard)
    .register('AsideNavigation', AsideNavigation)
    .register('ErrorBoundary', ErrorBoundaryInner)
    .register('ShardsTable', ShardsTable)
    .registerPlaceholder('ChatPanel', EmptyChatPanel)
    .registerPlaceholder('HealthcheckAssistantAction', EmptyHealthcheckAssistantAction);

export type ComponentsRegistry = ComponentsRegistryTemplate<typeof componentsRegistryInner>;

export const componentsRegistry = componentsRegistryInner as ComponentsRegistry;
