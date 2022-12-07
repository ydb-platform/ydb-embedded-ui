import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import {getEntityName} from '../../../containers/Tenant/utils';

import {formatPQGroupItem} from '../formatters';
import {InfoViewer, InfoViewerItem} from '..';

interface PersQueueGrouopInfoProps {
    data?: TEvDescribeSchemeResult;
}

export const PersQueueGroupInfo = ({data}: PersQueueGrouopInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    const pqGroup = data.PathDescription?.PersQueueGroup;
    const info: Array<InfoViewerItem> = [];

    info.push(formatPQGroupItem('Partitions', pqGroup?.Partitions || []));
    info.push(
        formatPQGroupItem(
            'PQTabletConfig',
            pqGroup?.PQTabletConfig || {PartitionConfig: {LifetimeSeconds: 0}},
        ),
    );

    return <InfoViewer title={entityName} info={info} />;
};
