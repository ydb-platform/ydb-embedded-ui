import React from 'react';

import {isSameDataQuality} from './dataQuality';
import type {ResponseDataQuality, TableDataWithQuality} from './types';

const DEFAULT_SOURCE = '';
const NO_REPORTS: Record<string, ResponseDataQuality> = {};

interface TableDataQualityState {
    scopeKey: string;
    reports: Record<string, ResponseDataQuality>;
}

interface LatestReports {
    scopeKey: string;
    bySource: Record<string, {requestKey: string; receivedAt: number}>;
}

/**
 * Keeps what the last response of a paginated table said about its data.
 *
 * The table reports through `onDataFetched` once per chunk, so reports of one view arrive
 * several times and not always in the order the responses were received.
 * - Within one request (same filters and sorting) the most recently received response wins.
 * - A report for another request replaces the current one: chunks report only the data
 *   they currently show, cached data included.
 * - Reports collected for another `scopeKey` are ignored, so a warning does not outlive
 *   the filters it was received for.
 *
 * `source` separates several tables that share the scope, e.g. expanded table groups.
 */
export function useTableDataQuality(scopeKey: string) {
    const [state, setState] = React.useState<TableDataQualityState>();
    const latestRef = React.useRef<LatestReports>();

    const handleDataFetched = React.useCallback(
        (data: TableDataWithQuality<unknown>, source: string = DEFAULT_SOURCE) => {
            const report = data.dataQuality;
            if (!report) {
                return;
            }

            if (latestRef.current?.scopeKey !== scopeKey) {
                latestRef.current = {scopeKey, bySource: {}};
            }

            const latest = latestRef.current.bySource[source];
            if (
                latest &&
                latest.requestKey === report.requestKey &&
                latest.receivedAt > report.receivedAt
            ) {
                return;
            }
            latestRef.current.bySource[source] = {
                requestKey: report.requestKey,
                receivedAt: report.receivedAt,
            };

            const {problems, needFilter, needSort, needGroup} = report;
            const quality: ResponseDataQuality = {problems, needFilter, needSort, needGroup};

            setState((prevState) => {
                const reports = prevState?.scopeKey === scopeKey ? prevState.reports : NO_REPORTS;
                const current = reports[source];

                if (prevState && current && isSameDataQuality(current, quality)) {
                    return prevState;
                }

                return {scopeKey, reports: {...reports, [source]: quality}};
            });
        },
        [scopeKey],
    );

    const dataQualityBySource = state?.scopeKey === scopeKey ? state.reports : NO_REPORTS;

    return {
        /** Report of the table that does not name its source */
        dataQuality: dataQualityBySource[DEFAULT_SOURCE] as ResponseDataQuality | undefined,
        dataQualityBySource,
        handleDataFetched,
    };
}
