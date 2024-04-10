import {combineReducers} from '@reduxjs/toolkit';

import {api} from './api';
import authentication from './authentication/authentication';
import cluster from './cluster/cluster';
import clusterNodes from './clusterNodes/clusterNodes';
import clusters from './clusters/clusters';
import describe from './describe';
import executeQuery from './executeQuery';
import executeTopQueries from './executeTopQueries/executeTopQueries';
import explainQuery from './explainQuery';
import fullscreen from './fullscreen';
import header from './header/header';
import healthcheckInfo from './healthcheckInfo/healthcheckInfo';
import heatmap from './heatmap';
import host from './host';
import hotKeys from './hotKeys/hotKeys';
import network from './network/network';
import node from './node/node';
import nodes from './nodes/nodes';
import nodesList from './nodesList';
import olapStats from './olapStats';
import overview from './overview/overview';
import partitions from './partitions/partitions';
import pDisk from './pdisk/pdisk';
import preview from './preview';
import saveQuery from './saveQuery';
import schema from './schema/schema';
import schemaAcl from './schemaAcl/schemaAcl';
import settings from './settings/settings';
import shardsWorkload from './shardsWorkload/shardsWorkload';
import singleClusterMode from './singleClusterMode';
import storage from './storage/storage';
import tablet from './tablet';
import tablets from './tablets';
import tabletsFilters from './tabletsFilters';
import tenant from './tenant/tenant';
import executeTopTables from './tenantOverview/executeTopTables/executeTopTables';
import {topNodesByCpu} from './tenantOverview/topNodesByCpu/topNodesByCpu';
import {topNodesByLoad} from './tenantOverview/topNodesByLoad/topNodesByLoad';
import {topNodesByMemory} from './tenantOverview/topNodesByMemory/topNodesByMemory';
import {tenantOverviewTopQueries} from './tenantOverview/topQueries/tenantOverviewTopQueries';
import {tenantOverviewTopShards} from './tenantOverview/topShards/tenantOverviewTopShards';
import topStorageGroups from './tenantOverview/topStorageGroups/topStorageGroups';
import tenants from './tenants/tenants';
import tooltip from './tooltip';
import topic from './topic';
import vDisk from './vdisk/vdisk';

export const rootReducer = {
    [api.reducerPath]: api.reducer,
    singleClusterMode,
    nodes,
    topNodesByLoad,
    topNodesByCpu,
    topNodesByMemory,
    cluster,
    clusterNodes,
    tenant,
    storage,
    topStorageGroups,
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
    pDisk,
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
    executeTopTables,
    tenantOverviewTopQueries,
    healthcheckInfo,
    shardsWorkload,
    tenantOverviewTopShards,
    hotKeys,
    authentication,
    header,
    saveQuery,
    fullscreen,
    clusters,
    vDisk,
};

const combinedReducer = combineReducers({
    ...rootReducer,
});

export default combinedReducer;
