import type {InfoViewerItem} from '..';
import {InfoViewer} from '..';
import {getEntityName} from '../../../containers/Tenant/utils';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';

import i18n from './i18n';
import {buildIndexInfo, buildVectorIndexInfo} from './utils';

interface TableIndexInfoProps {
    data?: TEvDescribeSchemeResult;
}

export const TableIndexInfo = ({data}: TableIndexInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return <div className="error">{i18n('alert_no-entity-data', {entity: entityName})}</div>;
    }

    const TableIndex = data.PathDescription?.TableIndex;
    const info: Array<InfoViewerItem> = buildIndexInfo(TableIndex);

    const vectorSettings = TableIndex?.VectorIndexKmeansTreeDescription?.Settings;

    if (!vectorSettings) {
        return <InfoViewer title={entityName} info={info} />;
    }

    const vectorInfo: Array<InfoViewerItem> = buildVectorIndexInfo(vectorSettings);

    return (
        <>
            <InfoViewer title={entityName} info={info} />
            <InfoViewer title={i18n('title_vector-index')} info={vectorInfo} />
        </>
    );
};
