import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TopNodes} from './TopNodes';
import {TopQueries} from './TopQueries';

interface TenantCpuProps {
    path?: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({path, additionalNodesProps}: TenantCpuProps) {
    return (
        <>
            <TopNodes path={path} additionalNodesProps={additionalNodesProps} />
            <TopQueries path={path} />
        </>
    );
}
