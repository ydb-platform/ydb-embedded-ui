import {combineReducers} from 'redux';

import nodes from './nodes';
import cluster from './cluster';
import tenant from './tenant';
import storage from './storage';
import node from './node';
import pdisk from './pdisk';
import vdisk from './vdisk';
import group from './group';
import tooltip from './tooltip';
import tablets from './tablets';
import heatmap from './heatmap';
import schema from './schema';
import host from './host';
import network from './network';
import pool from './pool';
import tenants from './tenants';
import tablet from './tablet';
import executeQuery from './executeQuery';
import explainQuery from './explainQuery';
import tabletsFilters from './tabletsFilters';
import clusterInfo from './clusterInfo';
import settings from './settings';
import preview from './preview';
import nodesList from './clusterNodes';
import describe from './describe';
import schemaAcl from './schemaAcl';
import executeTopQueries from './executeTopQueries';
import healthcheckInfo from './healthcheckInfo';
import shardsWorkload from './shardsWorkload';
import hotKeys from './hotKeys';
import olapStats from './olapStats';
import authentication from './authentication';
import header from './header';
import saveQuery from './saveQuery';
import fullscreen from './fullscreen';

function singleClusterMode(state = true) {
    return state;
}

export const rootReducer = {
    singleClusterMode,
    nodes,
    cluster,
    tenant,
    storage,
    node,
    pdisk,
    vdisk,
    group,
    tooltip,
    tablets,
    schema,
    olapStats,
    host,
    network,
    pool,
    tenants,
    tablet,
    executeQuery,
    explainQuery,
    tabletsFilters,
    heatmap,
    clusterInfo,
    settings,
    preview,
    nodesList,
    describe,
    schemaAcl,
    executeTopQueries,
    healthcheckInfo,
    shardsWorkload,
    hotKeys,
    authentication,
    header,
    saveQuery,
    fullscreen,
};

export default combineReducers({
    ...rootReducer,
});
