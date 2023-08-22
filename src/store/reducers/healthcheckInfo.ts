import _flow from 'lodash/fp/flow';
import _sortBy from 'lodash/fp/sortBy';
import _uniqBy from 'lodash/fp/uniqBy';
import {createSelector, Selector} from 'reselect';
import {Reducer} from 'redux';

import type {
    IHealthCheckInfoAction,
    IHealthcheckInfoRootStateSlice,
    IHealthcheckInfoState,
    IIssuesTree,
} from '../../types/store/healthcheck';
import type {IssueLog, StatusFlag} from '../../types/api/healthcheck';

import '../../services/api';
import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_HEALTHCHECK = createRequestActionTypes('cluster', 'FETCH_HEALTHCHECK');

const SET_DATA_WAS_NOT_LOADED = 'healthcheckInfo/SET_DATA_WAS_NOT_LOADED';

const initialState = {loading: false, wasLoaded: false};

const healthcheckInfo: Reducer<IHealthcheckInfoState, IHealthCheckInfoAction> = function (
    state = initialState,
    action,
) {
    switch (action.type) {
        case FETCH_HEALTHCHECK.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_HEALTHCHECK.SUCCESS: {
            const {data} = action;

            return {
                ...state,
                data,
                wasLoaded: true,
                loading: false,
                error: undefined,
            };
        }
        case FETCH_HEALTHCHECK.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
                wasLoaded: true,
                data: undefined,
            };
        }

        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

const mapStatusToPriority: Partial<Record<StatusFlag, number>> = {
    RED: 0,
    ORANGE: 1,
    YELLOW: 2,
    BLUE: 3,
    GREEN: 4,
};

const getReasonsForIssue = ({issue, data}: {issue: IssueLog; data: IssueLog[]}) => {
    return data.filter((item) => issue.reason && issue.reason.indexOf(item.id) !== -1);
};

const getRoots = (data: IssueLog[]): IssueLog[] => {
    let roots = data.filter((item) => {
        return !data.find((issue) => issue.reason && issue.reason.indexOf(item.id) !== -1);
    });

    roots = _flow([
        _uniqBy((item: IssueLog) => item.id),
        _sortBy(({status}: {status: StatusFlag}) => mapStatusToPriority[status]),
    ])(roots);

    return roots;
};

const getInvertedConsequencesTree = ({
    data,
    roots,
}: {
    data: IssueLog[];
    roots?: IssueLog[];
}): IIssuesTree[] => {
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

const getIssuesLog = (state: IHealthcheckInfoRootStateSlice) =>
    state.healthcheckInfo.data?.issue_log;

export const selectIssuesTreesRoots: Selector<IHealthcheckInfoRootStateSlice, IssueLog[]> =
    createSelector(getIssuesLog, (issues = []) => getRoots(issues));

export const selectIssuesTrees: Selector<IHealthcheckInfoRootStateSlice, IIssuesTree[]> =
    createSelector([getIssuesLog, selectIssuesTreesRoots], (data = [], roots = []) => {
        return getInvertedConsequencesTree({data, roots});
    });

export const selectIssuesStatistics: Selector<
    IHealthcheckInfoRootStateSlice,
    [StatusFlag, number][]
> = createSelector(getIssuesLog, (issues = []) => getIssuesStatistics(issues));

export function getHealthcheckInfo(database: string) {
    return createApiRequest({
        request: window.api.getHealthcheckInfo(database),
        actions: FETCH_HEALTHCHECK,
    });
}

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export default healthcheckInfo;
