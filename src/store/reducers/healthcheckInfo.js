import _ from 'lodash';
import _flow from 'lodash/fp/flow';
import _filter from 'lodash/fp/filter';
import _sortBy from 'lodash/fp/sortBy';
import _uniqBy from 'lodash/fp/uniqBy';
import {createSelector} from 'reselect';

import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_HEALTHCHECK = createRequestActionTypes('cluster', 'FETCH_HEALTHCHECK');

const initialState = {loading: false, wasLoaded: false};

const healthcheckInfo = function (state = initialState, action) {
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

const mapStatusToPriority = {
    RED: 0,
    ORANGE: 1,
    YELLOW: 2,
    BLUE: 3,
    GREEN: 4,
};

const getReasonsForIssue = ({issue, data}) => {
    return _.filter(data, (item) => issue.reason && issue.reason.indexOf(item.id) !== -1);
};

const getInvertedConsequencesTree = ({data, roots: receivedRoots}) => {
    let roots = receivedRoots;
    if (!roots && data) {
        roots = _flow([
            _filter((item) => {
                return !_.find(
                    data,
                    (issue) => issue.reason && issue.reason.indexOf(item.id) !== -1,
                );
            }),
            _uniqBy((item) => item.id),
            _sortBy(({status}) => mapStatusToPriority[status]),
        ])(data);
    }

    return _.map(roots, (issue) => {
        const reasonsItems = getInvertedConsequencesTree({
            roots: getReasonsForIssue({issue, data}),
            data,
        });

        return {
            ...issue,
            reasonsItems,
        };
    });
};

const getIssuesLog = (state) => state.healthcheckInfo.data?.issue_log;

export const selectInvertedIssuesConsequenceTrees = createSelector(getIssuesLog, (issueLog) => {
    return getInvertedConsequencesTree({data: issueLog});
});

export const selectIssueConsequenceById = createSelector(
    [selectInvertedIssuesConsequenceTrees, (state, id) => id],
    (issueTree, id) => issueTree.filter((issue) => issue.id === id)[0],
);

export function getHealthcheckInfo(database) {
    return createApiRequest({
        request: window.api.getHealthcheckInfo(database),
        actions: FETCH_HEALTHCHECK,
    });
}

export default healthcheckInfo;
