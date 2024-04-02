import {createSlot} from '../../components/slots';

import type {RedirectProps, RouteComponentProps} from 'react-router';
import type Cluster from '../Cluster/Cluster';
import type {Clusters} from '../Clusters/Clusters';
import type Node from '../Node/Node';
import type {PDiskPage} from '../PDiskPage/PDiskPage';
import type {VDiskPage} from '../VDiskPage/VDiskPage';
import type {Tablet} from '../Tablet';
import type TabletsFilters from '../TabletsFilters/TabletsFilters';
import type Tenant from '../Tenant/Tenant';

export const ClustersSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof Clusters} & RouteComponentProps) => React.ReactNode);
}>('clusters');
export const ClusterSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof Cluster} & RouteComponentProps) => React.ReactNode);
}>('cluster');
export const TenantSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof Tenant} & RouteComponentProps) => React.ReactNode);
}>('tenant');
export const NodeSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof Node} & RouteComponentProps) => React.ReactNode);
}>('node');
export const PDiskPageSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof PDiskPage} & RouteComponentProps) => React.ReactNode);
}>('pDisk');
export const VDiskPageSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof VDiskPage} & RouteComponentProps) => React.ReactNode);
}>('vDisk');
export const TabletSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof Tablet} & RouteComponentProps) => React.ReactNode);
}>('tablet');
export const TabletsFiltersSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof TabletsFilters} & RouteComponentProps) => React.ReactNode);
}>('tabletsFilters');

export const RoutesSlot = createSlot('routes');
export const RedirectSlot = createSlot<RedirectProps>('redirect');
