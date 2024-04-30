import {combineReducers} from '@reduxjs/toolkit';

import {api} from './api';
import authentication from './authentication/authentication';
import cluster from './cluster/cluster';
import clusters from './clusters/clusters';
import describe from './describe';
import executeQuery from './executeQuery';
import executeTopQueries from './executeTopQueries/executeTopQueries';
import explainQuery from './explainQuery';
import fullscreen from './fullscreen';
import header from './header/header';
import heatmap from './heatmap';
import host from './host';
import hotKeys from './hotKeys/hotKeys';
import network from './network/network';
import node from './node/node';
import nodes from './nodes/nodes';
import nodesList from './nodesList';
import overview from './overview/overview';
import partitions from './partitions/partitions';
import saveQuery from './saveQuery';
import schema from './schema/schema';
import schemaAcl from './schemaAcl/schemaAcl';
import settings from './settings/settings';
import shardsWorkload from './shardsWorkload/shardsWorkload';
import singleClusterMode from './singleClusterMode';
import storage from './storage/storage';
import tablets from './tablets';
import tabletsFilters from './tabletsFilters';
import tenant from './tenant/tenant';
import tenants from './tenants/tenants';
import tooltip from './tooltip';

export const rootReducer = {
    [api.reducerPath]: api.reducer,
    singleClusterMode,
    nodes,
    cluster,
    tenant,
    storage,
    node,
    tooltip,
    tablets,
    schema,
    overview,
    host,
    network,
    tenants,
    partitions,
    executeQuery,
    explainQuery,
    tabletsFilters,
    heatmap,
    settings,
    nodesList,
    describe,
    schemaAcl,
    executeTopQueries,
    shardsWorkload,
    hotKeys,
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
