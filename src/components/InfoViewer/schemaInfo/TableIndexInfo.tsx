import type {InfoViewerItem} from '..';
import {InfoViewer} from '..';
import {getEntityName} from '../../../containers/Tenant/utils';
import {EIndexType} from '../../../types/api/schema';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';

import i18n from './i18n';
import {buildFulltextIndexSettingsInfo, buildVectorIndexSettingsInfo} from './utils';

const b = cn('ydb-diagnostics-table-info');

interface TableIndexInfoProps {
    data?: TEvDescribeSchemeResult;
}

export const TableIndexInfo = ({data}: TableIndexInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return <div className="error">{i18n('alert_no-entity-data', {entity: entityName})}</div>;
    }

    const TableIndex = data.PathDescription?.TableIndex;

    let settings: Array<InfoViewerItem> = [];
    if (TableIndex?.Type === EIndexType.EIndexTypeGlobalVectorKmeansTree) {
        settings = buildVectorIndexSettingsInfo(
            TableIndex?.VectorIndexKmeansTreeDescription?.Settings,
        );
    }
    if (
        TableIndex?.Type === EIndexType.EIndexTypeGlobalFulltext ||
        TableIndex?.Type === EIndexType.EIndexTypeGlobalFulltextPlain ||
        TableIndex?.Type === EIndexType.EIndexTypeGlobalFulltextRelevance
    ) {
        settings = buildFulltextIndexSettingsInfo(TableIndex?.FulltextIndexDescription?.Settings);
    }

    if (!settings.length) {
        return null;
    }

    return (
        <div className={b()}>
            <InfoViewer
                info={settings}
                title={i18n('title_index-settings')}
                className={b('info-block')}
            />
        </div>
    );
};
