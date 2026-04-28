import {CircleXmark, FileCode, ListUl} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';

import MoniumIcon from '../../assets/icons/monium.svg';

/** Known link context values that map to specific icons and default titles */
export const CLUSTER_LINK_CONTEXT = {
    CORES: 'cores',
    LOGGING: 'logging',
    SLO_LOGS: 'slo-logs',
    MONITORING: 'monitoring',
} as const;

export type ClusterLinkContext = (typeof CLUSTER_LINK_CONTEXT)[keyof typeof CLUSTER_LINK_CONTEXT];

/** Map from known context to a Gravity UI icon */
export const CONTEXT_ICONS: Record<ClusterLinkContext, IconData> = {
    [CLUSTER_LINK_CONTEXT.CORES]: CircleXmark,
    [CLUSTER_LINK_CONTEXT.LOGGING]: ListUl,
    [CLUSTER_LINK_CONTEXT.SLO_LOGS]: FileCode,
    [CLUSTER_LINK_CONTEXT.MONITORING]: MoniumIcon,
};

export function getContextIcon(context: string | undefined): IconData | undefined {
    if (!context) {
        return undefined;
    }
    return CONTEXT_ICONS[context as ClusterLinkContext];
}
