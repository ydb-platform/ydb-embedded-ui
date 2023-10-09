import {useSelector} from 'react-redux';

import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import type {EPathType, TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import {TopNodes} from './TopNodes';
import {TopPools} from './TopPools';
import {TopShards} from './TopShards';
import {TopQueries} from './TopQueries';

interface TenantCpuProps {
    path: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantCpu({path, additionalNodesProps}: TenantCpuProps) {
    const {currentSchemaPath, currentSchema: currentItem = {}} = useSelector(
        (state: any) => state.schema,
    );
    const {PathType: preloadedPathType} = useSelector(
        (state: any) => state.schema.data[currentSchemaPath]?.PathDescription?.Self || {},
    );
    const {PathType: currentPathType} =
        (currentItem as TEvDescribeSchemeResult).PathDescription?.Self || {};

    const type: EPathType | undefined = preloadedPathType || currentPathType;

    return (
        <>
            <TopNodes path={path} type={type} additionalNodesProps={additionalNodesProps} />
            <TopPools path={path} type={type} additionalNodesProps={additionalNodesProps} />
            <TopShards path={path} />
            <TopQueries path={path} />
        </>
    );
}
