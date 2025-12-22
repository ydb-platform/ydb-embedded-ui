import {createSelector} from '@reduxjs/toolkit';

import type {IssueLog, StatusFlag} from '../../../types/api/healthcheck';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import {getLeavesFromTree} from './utils';

export const healthcheckApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getHealthcheckInfo: builder.query({
            queryFn: async (
                {database, maxLevel}: {database: string; maxLevel?: number},
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getHealthcheckInfo(
                        {database, maxLevel},
                        {signal},
                    );
                    return {
                        data,
                    };
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
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
        const aPriority = a.status ? mapStatusToPriority[a.status] || 0 : 0;
        const bPriority = b.status ? mapStatusToPriority[b.status] || 0 : 0;

        return aPriority - bPriority;
    });
};

const getRoots = (data: IssueLog[]): IssueLog[] => {
    return sortIssues(
        data.filter((item) => {
            return !data.find((issue) => issue.reason && issue.reason.indexOf(item.id) !== -1);
        }),
    );
};

const createGetHealthcheckInfoSelector = createSelector(
    (database: string) => database,
    (database) => healthcheckApi.endpoints.getHealthcheckInfo.select({database}),
);

export const selectCheckStatus = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetHealthcheckInfoSelector(database),
    (state: RootState, selectGetPost) => selectGetPost(state).data?.self_check_result,
);

const getIssuesLog = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetHealthcheckInfoSelector(database),
    (state: RootState, selectGetPost) => selectGetPost(state).data?.issue_log || [],
);

const selectIssuesTreesRoots = createSelector(getIssuesLog, (issues = []) => getRoots(issues));

export const selectLeavesIssues = createSelector(
    [getIssuesLog, selectIssuesTreesRoots],
    (data = [], roots = []) => {
        return roots.map((root) => sortIssues(getLeavesFromTree(data, root))).flat();
    },
);

export const selectAllHealthcheckInfo = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetHealthcheckInfoSelector(database),
    (state: RootState, selectGetPost) => selectGetPost(state).data,
);
