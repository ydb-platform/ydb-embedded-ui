import {combineReducers} from '@reduxjs/toolkit';

import nodes from './nodes/nodes';
import {topNodesByLoad} from './tenantOverview/topNodesByLoad/topNodesByLoad';
import {topNodesByCpu} from './tenantOverview/topNodesByCpu/topNodesByCpu';
import {topNodesByMemory} from './tenantOverview/topNodesByMemory/topNodesByMemory';
import cluster from './cluster/cluster';
import clusterNodes from './clusterNodes/clusterNodes';
import tenant from './tenant/tenant';
import storage from './storage/storage';
import topStorageGroups from './tenantOverview/topStorageGroups/topStorageGroups';
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
import pDisk from './pdisk/pdisk';
import executeQuery from './executeQuery';
import explainQuery from './explainQuery';
import tabletsFilters from './tabletsFilters';
import settings from './settings/settings';
import preview from './preview';
import nodesList from './nodesList';
import describe from './describe';
import schemaAcl from './schemaAcl/schemaAcl';
import executeTopQueries from './executeTopQueries/executeTopQueries';
import {tenantOverviewTopQueries} from './tenantOverview/topQueries/tenantOverviewTopQueries';
import executeTopTables from './tenantOverview/executeTopTables/executeTopTables';
import healthcheckInfo from './healthcheckInfo/healthcheckInfo';
import shardsWorkload from './shardsWorkload/shardsWorkload';
import {tenantOverviewTopShards} from './tenantOverview/topShards/tenantOverviewTopShards';
import hotKeys from './hotKeys/hotKeys';
import olapStats from './olapStats';
import authentication from './authentication/authentication';
import header from './header/header';
import saveQuery from './saveQuery';
import fullscreen from './fullscreen';
import singleClusterMode from './singleClusterMode';
import clusters from './clusters/clusters';
import vDisk from './vdisk/vdisk';

export const rootReducer = {
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
