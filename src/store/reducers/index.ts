import {combineReducers} from '@reduxjs/toolkit';

import {api} from './api';
import authentication from './authentication/authentication';
import {autoRefreshControlSlice} from './autoRefreshControl';
import cluster from './cluster/cluster';
import clusters from './clusters/clusters';
import executeQuery from './executeQuery';
import executeTopQueries from './executeTopQueries/executeTopQueries';
import fullscreen from './fullscreen';
import header from './header/header';
import heatmap from './heatmap';
import partitions from './partitions/partitions';
import saveQuery from './saveQuery';
import schema from './schema/schema';
import settings from './settings/settings';
import shardsWorkload from './shardsWorkload/shardsWorkload';
import singleClusterMode from './singleClusterMode';
import tablets from './tablets';
import tenant from './tenant/tenant';
import tenants from './tenants/tenants';
import tooltip from './tooltip';

export const rootReducer = {
    [api.reducerPath]: api.reducer,
    [autoRefreshControlSlice.reducerPath]: autoRefreshControlSlice.reducer,
    singleClusterMode,
    cluster,
    tenant,
    tooltip,
    tablets,
    schema,
    tenants,
    partitions,
    executeQuery,
    heatmap,
    settings,
    executeTopQueries,
    shardsWorkload,
    authentication,
    header,
    saveQuery,
    fullscreen,
    clusters,
};

const combinedReducer = combineReducers({
    ...rootReducer,
});

export default combinedReducer;
