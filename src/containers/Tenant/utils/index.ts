import {TPathDescription} from '../../../types/api/schema';
import {mapPathTypeToEntityName} from './schema';

export const getEntityName = (pathDescription?: TPathDescription) => {
    const {PathType, PathSubType} = pathDescription?.Self || {};

    return mapPathTypeToEntityName(PathType, PathSubType);
};
