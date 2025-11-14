import {combineReducers} from '@reduxjs/toolkit';

import {api} from './api';
import authentication from './authentication/authentication';
import cluster from './cluster/cluster';
import clusters from './clusters/clusters';
import executeTopQueries from './executeTopQueries/executeTopQueries';
import fullscreen from './fullscreen';
import header from './header/header';
import heatmap from './heatmap';
import partitions from './partitions/partitions';
import query from './query/query';
import queryActions from './queryActions/queryActions';
import schema from './schema/schema';
import settings from './settings/settings';
import shardsWorkload from './shardsWorkload/shardsWorkload';
import singleClusterMode from './singleClusterMode';
import tenant from './tenant/tenant';
import tooltip from './tooltip';

export const rootReducer = {
    [api.reducerPath]: api.reducer,
    singleClusterMode,
    cluster,
    tenant,
    tooltip,
    schema,
    partitions,
    query,
    heatmap,
    settings,
    executeTopQueries,
    shardsWorkload,
    authentication,
    header,
    queryActions,
    fullscreen,
    clusters,
};

const combinedReducer = combineReducers({
    ...rootReducer,
});

export default combinedReducer;
