import type {InfoViewerItem} from '..';
import {InfoViewer} from '..';
import {getEntityName} from '../../../containers/Tenant/utils';
import {EIndexType} from '../../../types/api/schema';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';

import i18n from './i18n';
import {
    buildFulltextIndexSettingsInfo,
    buildIndexInfo,
    buildVectorIndexSettingsInfo,
} from './utils';

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
    const info: Array<InfoViewerItem> = buildIndexInfo(TableIndex);

    let settings: Array<InfoViewerItem> = [];
    if (TableIndex?.Type === EIndexType.EIndexTypeGlobalVectorKmeansTree) {
        settings = buildVectorIndexSettingsInfo(
            TableIndex?.VectorIndexKmeansTreeDescription?.Settings,
        );
    }
    if (TableIndex?.Type === EIndexType.EIndexTypeGlobalFulltext) {
        settings = buildFulltextIndexSettingsInfo(TableIndex?.FulltextIndexDescription?.Settings);
    }

    return (
        <div className={b()}>
            <InfoViewer
                info={info}
                title={entityName}
                className={b('info-block')}
                renderEmptyState={() => <div className={b('title')}>{entityName}</div>}
            />
            {settings && settings.length ? (
                <InfoViewer
                    info={settings}
                    title={i18n('title_index-settings')}
                    className={b('info-block')}
                />
            ) : null}
        </div>
    );
};
