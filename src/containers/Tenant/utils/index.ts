import {EPathType} from '../../../types/api/schema';
import type {TPathDescription} from '../../../types/api/schema';

import {mapIndexTypeToEntityName, mapPathTypeToEntityName} from './schema';

export const getEntityName = (pathDescription?: TPathDescription) => {
    const {PathType, PathSubType} = pathDescription?.Self || {};

    if (PathType === EPathType.EPathTypeTableIndex) {
        return mapIndexTypeToEntityName(pathDescription?.TableIndex?.Type);
    }

    return mapPathTypeToEntityName(PathType, PathSubType);
};

export const isReadOnlyTable = (pathDescription?: TPathDescription) => {
    return pathDescription?.UserAttributes?.some(({Key, Value}) => {
        return Key === '__async_replica' && Value === 'true';
    });
};
