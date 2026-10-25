import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {DatacenterLabel} from '../../../../components/Datacenter/DatacenterLabel';
import {normalizeDatacenter} from '../../../../utils/datacenters';
import {NodeMetadataContext} from '../../../../utils/hooks/useNodesMap';

export function DatacenterLegend() {
    const nodes = React.useContext(NodeMetadataContext);
    const names = React.useMemo(
        () =>
            [
                ...new Set(
                    [...(nodes?.values() ?? [])]
                        .map((node) => normalizeDatacenter(node.DCKey || node.DC))
                        .filter((name) => name !== undefined),
                ),
            ].sort(),
        [nodes],
    );

    return (
        <Flex gap={2} alignItems="center" wrap="wrap">
            {names.map((name) => (
                <DatacenterLabel key={name} name={name} />
            ))}
            <DatacenterLabel />
        </Flex>
    );
}
