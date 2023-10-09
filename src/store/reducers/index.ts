import {combineReducers} from 'redux';

import nodes from './nodes/nodes';
import topNodes from './tenantOverview/topNodes/topNodes';
import topPools from './tenantOverview/topPools/topPools';
import cluster from './cluster/cluster';
import clusterNodes from './clusterNodes/clusterNodes';
import tenant from './tenant/tenant';
import storage from './storage/storage';
import node from './node/node';
import tooltip from './tooltip';
import tablets from './tablets';
import heatmap from './heatmap';
import schema from './schema/schema';
import overview from './overview/overview';
import host from './host';
import network from './network/network';
import tenants from './tenants/tenants';
import tablet from './tablet';
import topic from './topic';
import partitions from './partitions/partitions';
import executeQuery from './executeQuery';
import explainQuery from './explainQuery';
import tabletsFilters from './tabletsFilters';
import settings from './settings/settings';
import preview from './preview';
import nodesList from './nodesList';
import describe from './describe';
import schemaAcl from './schemaAcl/schemaAcl';
import executeTopQueries from './executeTopQueries/executeTopQueries';
import tenantOverviewExecuteTopQueries from './tenantOverview/executeTopQueries/executeTopQueries';
import healthcheckInfo from './healthcheckInfo';
import shardsWorkload from './shardsWorkload/shardsWorkload';
import executeTopShards from './tenantOverview/executeTopShards/executeTopShards';
import hotKeys from './hotKeys';
import olapStats from './olapStats';
import authentication from './authentication/authentication';
import header from './header/header';
import saveQuery from './saveQuery';
import fullscreen from './fullscreen';
import singleClusterMode from './singleClusterMode';

export const rootReducer = {
    singleClusterMode,
    nodes,
    topNodes,
    topPools,
    cluster,
    clusterNodes,
    tenant,
    storage,
    node,
    tooltip,
    tablets,
    schema,
    overview,
    olapStats,
    host,
    network,
    tenants,
    tablet,
    topic,
    partitions,
    executeQuery,
    explainQuery,
    tabletsFilters,
    heatmap,
    settings,
    preview,
    nodesList,
    describe,
    schemaAcl,
    executeTopQueries,
    tenantOverviewExecuteTopQueries,
    healthcheckInfo,
    shardsWorkload,
    executeTopShards,
    hotKeys,
    authentication,
    header,
    saveQuery,
    fullscreen,
};

const combinedReducer = combineReducers({
    ...rootReducer,
});

export type RootReducer = typeof combinedReducer;
export type RootState = ReturnType<RootReducer>;
export type GetState = () => RootState;

export default combinedReducer;
