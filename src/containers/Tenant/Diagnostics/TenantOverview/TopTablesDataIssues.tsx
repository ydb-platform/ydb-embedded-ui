import {DataIssuesIndicator} from '../../../../components/DataIssuesAlert/DataIssuesIndicator';
import {
    getNodesDataIssues,
    getStorageGroupsDataIssues,
} from '../../../../utils/dataIssues/classify';
import {getResponseDataQuality} from '../../../../utils/dataIssues/dataQuality';
import type {ResponseDataQuality} from '../../../../utils/dataIssues/types';

import {b} from './utils';

interface TopTableDataIssuesProps {
    response?: Partial<ResponseDataQuality>;
}

/** Tells that the top of database nodes was built from incomplete data */
export function TopNodesDataIssues({response}: TopTableDataIssuesProps) {
    const dataQuality = getResponseDataQuality(response);

    return (
        <DataIssuesIndicator
            className={b('data-issues')}
            issues={getNodesDataIssues(dataQuality, {hasDatabase: true})}
            problems={dataQuality?.problems}
        />
    );
}

/** Tells that the top of storage groups was built from incomplete data */
export function TopGroupsDataIssues({response}: TopTableDataIssuesProps) {
    const dataQuality = getResponseDataQuality(response);

    return (
        <DataIssuesIndicator
            className={b('data-issues')}
            issues={getStorageGroupsDataIssues(dataQuality)}
            problems={dataQuality?.problems}
        />
    );
}
