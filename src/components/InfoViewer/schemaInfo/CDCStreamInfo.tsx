import type {TEvDescribeSchemeResult, TCdcStreamDescription} from '../../../types/api/schema';
import {useTypedSelector} from '../../../utils/hooks';
import {selectSchemaData} from '../../../store/reducers/schema';

import {formatCdcStreamItem, formatPQGroupItem, formatCommonItem} from '../formatters';
import {InfoViewer, InfoViewerItem} from '..';

const DISPLAYED_FIELDS: Set<keyof TCdcStreamDescription> = new Set(['Mode', 'Format']);

interface CDCStreamInfoProps {
    data?: TEvDescribeSchemeResult;
    childrenPaths?: string[];
}

export const CDCStreamInfo = ({data, childrenPaths}: CDCStreamInfoProps) => {
    const pqGroupData = useTypedSelector((state) => selectSchemaData(state, childrenPaths?.[0]));

    if (!data || !pqGroupData) {
        return <div className="error">No Changefeed data</div>;
    }

    const cdcStream = data.PathDescription?.CdcStreamDescription;
    const pqGroup = pqGroupData?.PathDescription?.PersQueueGroup;

    const info: Array<InfoViewerItem> = [];

    info.push(formatCommonItem('CreateStep', data.PathDescription?.Self?.CreateStep));

    let key: keyof TCdcStreamDescription;
    for (key in cdcStream) {
        if (DISPLAYED_FIELDS.has(key)) {
            info.push(formatCdcStreamItem(key, cdcStream?.[key]));
        }
    }

    info.push(formatPQGroupItem('Partitions', pqGroup?.Partitions || []));
    info.push(
        formatPQGroupItem(
            'PQTabletConfig',
            pqGroup?.PQTabletConfig || {PartitionConfig: {LifetimeSeconds: 0}},
        ),
    );

    return <InfoViewer title={'Changefeed'} info={info} />;
};
