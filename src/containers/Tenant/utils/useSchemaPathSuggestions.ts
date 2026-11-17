import React from 'react';

import type {SuggestInputItem} from '../../../components/SuggestInput/SuggestInput';
import {useClusterWithProxy} from '../../../store/reducers/cluster/cluster';
import {schemaApi} from '../../../store/reducers/schema/schema';
import type {TDirEntry} from '../../../types/api/schema';
import {EPathType} from '../../../types/api/schema';

const DEFAULT_PATH_TYPES = [EPathType.EPathTypeDir];

/**
 * Splits the typed relative path into the part that is already complete
 * (everything up to the last slash) and the name that is being typed.
 */
export function splitPathInput(value: string) {
    const lastSlashIndex = value.lastIndexOf('/');
    const completed = value.slice(0, lastSlashIndex + 1);

    return {
        /** Typed text up to the last slash inclusive, kept as is */
        completed,
        /** Non-empty segments of the completed part */
        segments: completed.split('/').filter(Boolean),
        /** Beginning of the name that is being typed */
        namePrefix: value.slice(lastSlashIndex + 1),
    };
}

export function getPathSuggestions({
    value,
    entries = [],
    pathTypes = DEFAULT_PATH_TYPES,
}: {
    value: string;
    entries?: TDirEntry[];
    pathTypes?: EPathType[];
}): SuggestInputItem[] {
    const {completed, namePrefix} = splitPathInput(value);
    const lowerPrefix = namePrefix.toLowerCase();

    return entries
        .filter(
            ({Name, PathType}) =>
                Name &&
                PathType &&
                pathTypes.includes(PathType) &&
                Name.toLowerCase().startsWith(lowerPrefix),
        )
        .map(({Name = ''}) => Name)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({value: `${completed}${name}/`, content: name}));
}

interface UseSchemaPathSuggestionsParams {
    /** Relative path typed by the user, e.g. `dir/subdir/na` */
    value: string;
    /** Absolute schema path the typed value is relative to */
    basePath: string;
    database: string;
    databaseFullPath: string;
    /** Types of schema objects to suggest, only directories by default */
    pathTypes?: EPathType[];
    skip?: boolean;
}

/**
 * Suggests existing schema objects (directories by default) for a path that is being typed.
 * Children are requested once per directory level, not on every keystroke.
 */
export function useSchemaPathSuggestions({
    value,
    basePath,
    database,
    databaseFullPath,
    pathTypes,
    skip,
}: UseSchemaPathSuggestionsParams): SuggestInputItem[] {
    const useMetaProxy = useClusterWithProxy();

    const directoryPath = [basePath.replace(/\/+$/, ''), ...splitPathInput(value).segments].join(
        '/',
    );

    const {currentData: entries} = schemaApi.useGetSchemaPathChildrenQuery(
        {path: directoryPath, database, databaseFullPath, useMetaProxy},
        {skip: skip || !basePath, refetchOnMountOrArgChange: true},
    );

    return React.useMemo(
        () => getPathSuggestions({value, entries, pathTypes}),
        [value, entries, pathTypes],
    );
}
