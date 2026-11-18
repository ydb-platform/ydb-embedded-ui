import {DataIssuesIndicator} from '../../../../components/DataIssuesAlert/DataIssuesIndicator';
import {getDataIssues} from '../../../../utils/dataIssues/classify';
import type {DataIssuesSubject} from '../../../../utils/dataIssues/classify';
import type {ResponseDataQuality} from '../../../../utils/dataIssues/types';

import {b} from './utils';

interface TopTableDataIssuesProps {
    /** What the handler reported about the response the top is built from */
    dataQuality?: ResponseDataQuality;
    /** Title of the top: there are several of them on a page, so the warning names its table */
    tableTitle: string;
}

const TOP_NODES: DataIssuesSubject = {type: 'nodes', hasDatabase: true};
const TOP_GROUPS: DataIssuesSubject = {type: 'storageGroups'};

function TopTableDataIssues({
    dataQuality,
    tableTitle,
    subject,
}: TopTableDataIssuesProps & {subject: DataIssuesSubject}) {
    return (
        <DataIssuesIndicator
            className={b('data-issues')}
            issues={getDataIssues(dataQuality, subject)}
            problems={dataQuality?.problems}
            subject={tableTitle}
        />
    );
}

/** Tells that the top of database nodes was built from incomplete data */
export function TopNodesDataIssues(props: TopTableDataIssuesProps) {
    return <TopTableDataIssues {...props} subject={TOP_NODES} />;
}

/** Tells that the top of storage groups was built from incomplete data */
export function TopGroupsDataIssues(props: TopTableDataIssuesProps) {
    return <TopTableDataIssues {...props} subject={TOP_GROUPS} />;
}
