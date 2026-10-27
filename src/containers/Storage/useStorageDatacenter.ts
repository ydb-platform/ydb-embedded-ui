import React from 'react';

import {useDatacenterColorIndexes} from '../../components/Datacenter/DatacenterContext';
import {
    getDatacenterColor,
    getDatacenterColorVariant,
    normalizeDatacenter,
} from '../../utils/datacenters';
import {NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import type {VDiskDisplayState} from '../../utils/disks/displayState';
import {useNodesMap} from '../../utils/hooks/useNodesMap';

export function useStorageDatacenter() {
    const nodes = useNodesMap();
    const indexes = useDatacenterColorIndexes();

    return React.useCallback(
        (nodeId?: number): VDiskDisplayState => {
            const node = nodeId === undefined ? undefined : nodes?.get(nodeId);
            const name = normalizeDatacenter(node?.DCKey || node?.DC);
            return {
                mode: 'datacenter',
                datacenter: {
                    name,
                    color: getDatacenterColor(name, indexes),
                    variant: getDatacenterColorVariant(name, indexes),
                },
                severity: NOT_AVAILABLE_SEVERITY,
                icon: undefined,
                striped: false,
                iconPlacement: 'inline',
                borderless: true,
                showNoDataPlaceholder: false,
            };
        },
        [nodes, indexes],
    );
}
