import {createSlot} from '../../components/slots';

import type {RedirectProps} from 'react-router';
import type Cluster from '../Cluster/Cluster';
import type {Clusters} from '../Clusters/Clusters';
import type Node from '../Node/Node';
import type {Tablet} from '../Tablet';
import type TabletsFilters from '../TabletsFilters/TabletsFilters';
import type Tenant from '../Tenant/Tenant';

export const ClustersSlot = createSlot<{
    children: React.ReactNode | ((props: {component: typeof Clusters}) => React.ReactNode);
}>('clusters');
export const ClusterSlot = createSlot<{
    children: React.ReactNode | ((props: {component: typeof Cluster}) => React.ReactNode);
}>('cluster');
export const TenantSlot = createSlot<{
    children: React.ReactNode | ((props: {component: typeof Tenant}) => React.ReactNode);
}>('tenant');
export const NodeSlot = createSlot<{
    children: React.ReactNode | ((props: {component: typeof Node}) => React.ReactNode);
}>('node');
export const TabletSlot = createSlot<{
    children: React.ReactNode | ((props: {component: typeof Tablet}) => React.ReactNode);
}>('tablet');
export const TabletsFiltersSlot = createSlot<{
    children: React.ReactNode | ((props: {component: typeof TabletsFilters}) => React.ReactNode);
}>('tabletsFilters');

export const RoutesSlot = createSlot('routes');
export const RedirectSlot = createSlot<RedirectProps>('redirect');
