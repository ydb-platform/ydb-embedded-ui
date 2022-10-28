import type {TEvDescribeSchemeResult, TCdcStreamDescription} from '../../../types/api/schema';

import {formatCdcStreamItem, formatCommonItem} from '../formatters';
import {InfoViewer, InfoViewerItem} from '..';

const DISPLAYED_FIELDS: Set<keyof TCdcStreamDescription> = new Set(['Mode', 'Format']);

interface CDCStreamInfoProps {
    data?: TEvDescribeSchemeResult;
}

export const CDCStreamInfo = ({data}: CDCStreamInfoProps) => {
    if (!data) {
        return <div className="error">No CDC Stream data</div>;
    }

    const TableIndex = data.PathDescription?.CdcStreamDescription;
    const info: Array<InfoViewerItem> = [];

    info.push(formatCommonItem('PathType', data.PathDescription?.Self?.PathType));
    info.push(formatCommonItem('CreateStep', data.PathDescription?.Self?.CreateStep));

    let key: keyof TCdcStreamDescription;
    for (key in TableIndex) {
        if (DISPLAYED_FIELDS.has(key)) {
            info.push(formatCdcStreamItem(key, TableIndex?.[key]));
        }
    }

    return <>{info.length ? <InfoViewer info={info}></InfoViewer> : <>Empty</>}</>;
};
