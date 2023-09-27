import {useSelector} from 'react-redux';

import type {TEvDescribeSchemeResult} from '../../../../../types/api/schema';
import type {AdditionalNodesProps} from '../../../../../types/additionalProps';
import {TopNodes} from './TopNodes';

interface TenantCpuProps {
    path?: string;
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
    return (
        <TopNodes
            path={path}
            type={preloadedPathType || currentPathType}
            additionalNodesProps={additionalNodesProps}
        />
    );
}
