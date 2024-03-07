import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TenantDashboard} from '../TenantDashboard/TenantDashboard';
import {cpuDashboardConfig} from './cpuDashboardConfig';
import {TopNodesByLoad} from './TopNodesByLoad';
import {TopNodesByCpu} from './TopNodesByCpu';
import {TopShards} from './TopShards';
import {TopQueries} from './TopQueries';

interface TenantCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({path, additionalNodesProps}: TenantCpuProps) {
    return (
        <>
            <TenantDashboard database={path} charts={cpuDashboardConfig} />
            <TopNodesByLoad path={path} additionalNodesProps={additionalNodesProps} />
            <TopNodesByCpu path={path} additionalNodesProps={additionalNodesProps} />
            <TopShards path={path} />
            <TopQueries path={path} />
        </>
    );
}
