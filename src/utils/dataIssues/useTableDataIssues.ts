import React from 'react';

import {canDataIssuesHideRows, getDataIssues} from './classify';
import type {DataIssueKind, DataIssuesSubject} from './classify';
import {mergeDataQuality} from './dataQuality';
import type {ResponseDataQuality} from './types';
import {useTableDataQuality} from './useTableDataQuality';

export interface TableDataIssues {
    /** What to tell the user about the rows on screen, in the display order */
    issues: DataIssueKind[];
    /** Raw problem codes of the responses */
    problems: string[];
    /** Rows may be missing because of the issues: an empty table does not prove there are none */
    rowsMayBeMissing: boolean;
}

const NO_PROBLEMS: string[] = [];

function useDataIssues(
    dataQuality: ResponseDataQuality | undefined,
    subject: DataIssuesSubject,
): TableDataIssues {
    // The subject is described by primitives, so callers can pass a new object on every render
    const type = subject.type;
    const hasGroupFilter = subject.type === 'nodes' && Boolean(subject.hasGroupFilter);
    const hasDatabase = subject.type === 'nodes' && Boolean(subject.hasDatabase);
    const storageNodes = subject.type === 'nodes' && Boolean(subject.storageNodes);

    return React.useMemo(() => {
        const issues = getDataIssues(
            dataQuality,
            type === 'nodes' ? {type, hasGroupFilter, hasDatabase, storageNodes} : {type},
        );

        return {
            issues,
            problems: dataQuality?.problems ?? NO_PROBLEMS,
            rowsMayBeMissing: canDataIssuesHideRows(issues),
        };
    }, [dataQuality, type, hasGroupFilter, hasDatabase, storageNodes]);
}

/**
 * Data issues of a paginated table: collects what its rendered chunks report
 * (pass `handleChunkDataChange` to the table) and says what to tell the user.
 */
export function useTableDataIssues(subject: DataIssuesSubject) {
    const {dataQuality, handleChunkDataChange} = useTableDataQuality();

    return {...useDataIssues(dataQuality, subject), handleChunkDataChange};
}

/** The part of a response with the list of table groups that tells about its quality */
interface TableGroupsResponse {
    dataQuality: ResponseDataQuality;
    tableGroups?: unknown[];
    groups?: unknown[];
    nodes?: unknown[];
}

/**
 * Data issues of a table split into groups: unites the response with the list of groups
 * and what the chunks of the tables of expanded groups report (a collapsed group renders no table).
 * Pass `getGroupChunkDataChangeHandler(groupName)` to the table of a group.
 */
export function useGroupedTableDataIssues(
    subject: DataIssuesSubject,
    response: TableGroupsResponse | undefined,
) {
    const {dataQuality: chunksQuality, getChunkDataChangeHandler} = useTableDataQuality();

    const responseQuality = response?.dataQuality;
    // Without grouping the handler returns a plain list of rows instead of the groups
    const plainListReturned =
        !response?.tableGroups?.length &&
        Boolean(response?.groups?.length || response?.nodes?.length);

    const dataQuality = React.useMemo(
        () =>
            mergeDataQuality([
                responseQuality && plainListReturned
                    ? {...responseQuality, needGroup: true}
                    : responseQuality,
                chunksQuality,
            ]),
        [responseQuality, plainListReturned, chunksQuality],
    );

    return {
        ...useDataIssues(dataQuality, subject),
        getGroupChunkDataChangeHandler: getChunkDataChangeHandler,
    };
}
