import type {RedirectProps, RouteComponentProps} from 'react-router-dom';

import {createSlot} from '../../components/slots';
import type {Cluster} from '../Cluster/Cluster';
import type {HomePage} from '../HomePage/HomePage';
import type {Node} from '../Node/Node';
import type {PDiskPage} from '../PDiskPage/PDiskPage';
import type {StorageGroupPage} from '../StorageGroupPage/StorageGroupPage';
import type {Tablet} from '../Tablet';
import type {Tenant} from '../Tenant/Tenant';
import type {VDiskPage} from '../VDiskPage/VDiskPage';

export const HomePageSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof HomePage} & RouteComponentProps) => React.ReactNode);
}>('homePage');
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
export const StorageGroupSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof StorageGroupPage} & RouteComponentProps) => React.ReactNode);
}>('storageGroup');
export const TabletSlot = createSlot<{
    children:
        | React.ReactNode
        | ((props: {component: typeof Tablet} & RouteComponentProps) => React.ReactNode);
}>('tablet');

export const RoutesSlot = createSlot<{children: React.ReactNode}>('routes');
export const RedirectSlot = createSlot<RedirectProps>('redirect');
