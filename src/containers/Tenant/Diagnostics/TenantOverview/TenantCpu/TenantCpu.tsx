import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
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
            <TopNodesByLoad path={path} additionalNodesProps={additionalNodesProps} />
            <TopNodesByCpu path={path} additionalNodesProps={additionalNodesProps} />
            <TopShards path={path} />
            <TopQueries path={path} />
        </>
    );
}
