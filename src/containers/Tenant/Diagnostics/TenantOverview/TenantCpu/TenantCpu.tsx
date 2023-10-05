import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TopShards} from './TopShards';
import {TopNodes} from './TopNodes';
import {TopQueries} from './TopQueries';

interface TenantCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({path, additionalNodesProps}: TenantCpuProps) {
    return (
        <>
            <TopNodes path={path} additionalNodesProps={additionalNodesProps} />
            <TopShards path={path} />
            <TopQueries path={path} />
        </>
    );
}
