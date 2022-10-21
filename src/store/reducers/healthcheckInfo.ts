import _flow from 'lodash/fp/flow';
import _sortBy from 'lodash/fp/sortBy';
import _uniqBy from 'lodash/fp/uniqBy';
import _omit from 'lodash/omit';
import {createSelector} from 'reselect';

import {IIssuesTree} from '../../types/store/healthcheck';
import {HealthCheckAPIResponse, IssueLog, StatusFlag} from '../../types/api/healthcheck';

import '../../services/api';
import {createRequestActionTypes, createApiRequest, ApiRequestAction} from '../utils';

const FETCH_HEALTHCHECK = createRequestActionTypes('cluster', 'FETCH_HEALTHCHECK');

const initialState = {loading: false, wasLoaded: false};

const healthcheckInfo = function (
    state = initialState,
    action: ApiRequestAction<typeof FETCH_HEALTHCHECK, HealthCheckAPIResponse, unknown>,
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

const getRoots = (data: IssueLog[]) => {
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

const getIssuesLog = (state: any): IssueLog[] | undefined => state.healthcheckInfo.data?.issue_log;

export const selectIssuesTreesRoots = createSelector(getIssuesLog, (issues = []) =>
    getRoots(issues),
);

export const selectIssuesTrees = createSelector(
    [getIssuesLog, selectIssuesTreesRoots],
    (data = [], roots = []) => {
        return getInvertedConsequencesTree({data, roots});
    },
);

export const selectIssuesTreeById = createSelector(
    [selectIssuesTrees, (_: any, id: string | undefined) => id],
    (issuesTrees = [], id) => issuesTrees.find((issuesTree: IIssuesTree) => issuesTree.id === id),
);

export function getHealthcheckInfo(database: string) {
    return createApiRequest({
        request: window.api.getHealthcheckInfo(database),
        actions: FETCH_HEALTHCHECK,
    });
}

export default healthcheckInfo;
