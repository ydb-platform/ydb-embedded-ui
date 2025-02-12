import {createSelector} from '@reduxjs/toolkit';

import type {IssueLog, StatusFlag} from '../../../types/api/healthcheck';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import type {IssuesTree} from './types';

const healthQueryFn = async (
    {database, maxLevel}: {database: string; maxLevel?: number; disabled?: boolean},
    {signal}: {signal: AbortSignal},
) => {
    try {
        const data = await window.api.viewer.getHealthcheckInfo({database, maxLevel}, {signal});
        return {data};
    } catch (error) {
        return {error};
    }
};

export const healthcheckApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getHealthcheckInfo: builder.query({
            queryFn: healthQueryFn,
            providesTags: ['All'],
        }),
        getManualHealthcheckInfo: builder.query({
            queryFn: healthQueryFn,
            providesTags: ['ManualRefresh'],
        }),
    }),
    overrideExisting: 'throw',
});

const mapStatusToPriority: Partial<Record<StatusFlag, number>> = {
    RED: 0,
    ORANGE: 1,
    YELLOW: 2,
    BLUE: 3,
    GREEN: 4,
};

const sortIssues = (data: IssueLog[]): IssueLog[] => {
    return data.sort((a, b) => {
        const aPriority = mapStatusToPriority[a.status] || 0;
        const bPriority = mapStatusToPriority[b.status] || 0;

        return aPriority - bPriority;
    });
};

const getReasonsForIssue = ({issue, data}: {issue: IssueLog; data: IssueLog[]}) => {
    return sortIssues(data.filter((item) => issue.reason && issue.reason.indexOf(item.id) !== -1));
};

const getRoots = (data: IssueLog[]): IssueLog[] => {
    return sortIssues(
        data.filter((item) => {
            return !data.find((issue) => issue.reason && issue.reason.indexOf(item.id) !== -1);
        }),
    );
};

const getInvertedConsequencesTree = ({
    data,
    roots,
}: {
    data: IssueLog[];
    roots?: IssueLog[];
}): IssuesTree[] => {
    return roots
        ? roots.map((issue) => {
              const reasonsItems = getInvertedConsequencesTree({
                  roots: getReasonsForIssue({issue, data}),
                  data,
              });

              return {
                  ...issue,
                  reasonsItems,
              };
          })
        : [];
};

const getIssuesStatistics = (data: IssueLog[]): [StatusFlag, number][] => {
    const issuesMap = {} as Record<StatusFlag, number>;

    for (const issue of data) {
        if (!issuesMap[issue.status]) {
            issuesMap[issue.status] = 0;
        }
        issuesMap[issue.status]++;
    }

    return (Object.entries(issuesMap) as [StatusFlag, number][]).sort(([aStatus], [bStatus]) => {
        const bPriority = mapStatusToPriority[bStatus] || 0;
        const aPriority = mapStatusToPriority[aStatus] || 0;

        return aPriority - bPriority;
    });
};

const createGetHealthcheckInfoSelector = createSelector(
    (database: string) => database,
    (database) => healthcheckApi.endpoints.getHealthcheckInfo.select({database}),
);

const getIssuesLog = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetHealthcheckInfoSelector(database),
    (state: RootState, selectGetPost) => selectGetPost(state).data?.issue_log || [],
);

const selectIssuesTreesRoots = createSelector(getIssuesLog, (issues = []) => getRoots(issues));

export const selectIssuesTrees = createSelector(
    [getIssuesLog, selectIssuesTreesRoots],
    (data = [], roots = []) => {
        return getInvertedConsequencesTree({data, roots});
    },
);

export const selectIssuesStatistics = createSelector(getIssuesLog, (issues = []) =>
    getIssuesStatistics(issues),
);
