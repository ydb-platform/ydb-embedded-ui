import type {TPathDescription} from '../../../types/api/schema';

import {mapPathTypeToEntityName} from './schema';

export const getEntityName = (pathDescription?: TPathDescription) => {
    const {PathType, PathSubType} = pathDescription?.Self || {};

    return mapPathTypeToEntityName(PathType, PathSubType);
};

export const isReadOnlyTable = (pathDescription?: TPathDescription) => {
    return pathDescription?.UserAttributes?.some(({Key, Value}) => {
        return Key === '__async_replica' && Value === 'true';
    });
};
