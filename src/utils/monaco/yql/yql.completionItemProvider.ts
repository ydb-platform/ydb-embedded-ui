import type {YQLEntity} from '@gravity-ui/websql-autocomplete/yql';
import type {FetchedColumn} from 'monaco-yql-languages/build/yql/autocomplete';
import {registerCompletionItemProvider} from 'monaco-yql-languages/build/yql/autocomplete';

import {isAutocompleteColumn} from '../../../types/api/autocomplete';
import type {TAutocompleteEntity} from '../../../types/api/autocomplete';
import {YQL_LANGUAGE_ID} from '../constats';

import {
    checkIsDirectory,
    filterAutocompleteEntities,
    getAggregateFunctions,
    getColumnDetails,
    getEntitySettings,
    getPragmas,
    getSimpleFunctions,
    getSimpleTypes,
    getTableFunctions,
    getUdfs,
    getWindowFunctions,
    normalizeEntityNames,
    removeBackticks,
} from './generateSuggestions';

export function registerYQLCompletionItemProvider(database: string) {
    const fetchEntities = async (prefix: string, neededTypes: YQLEntity[]) => {
        const data = await window.api.viewer.autocomplete({
            database,
            prefix: removeBackticks(prefix),
            limit: 1000,
        });
        if (!data.Success || !data.Result.Entities) {
            return [];
        }
        const filteredEntities = filterAutocompleteEntities(data.Result.Entities, neededTypes);
        return (
            filteredEntities?.map(({Name, Type}) => ({
                value: Name,
                detail: Type,
                isDir: checkIsDirectory(Type),
            })) ?? []
        );
    };

    const fetchEntityColumns = async (entityNames: string[]) => {
        let autocompleteEntities: TAutocompleteEntity[] = [];
        const normalizedNames = normalizeEntityNames(entityNames, database);
        const autocompleteResponse = await window.api.viewer.autocomplete({
            database,
            table: normalizedNames,
            limit: 1000,
        });
        if (autocompleteResponse.Success) {
            autocompleteEntities = autocompleteResponse.Result.Entities ?? [];
        }
        const result: FetchedColumn[] = [];
        autocompleteEntities.forEach((entity) => {
            if (isAutocompleteColumn(entity)) {
                result.push({
                    name: entity.Name,
                    detail: getColumnDetails(entity),
                    parent: entity.Parent,
                });
            }
        });
        return result;
    };

    registerCompletionItemProvider(YQL_LANGUAGE_ID, [' ', '.', '`', '(', '/'], {
        fetchEntities,
        fetchEntityColumns,
        getEntitySettings,
        getPragmas,
        getSimpleFunctions,
        getAggregateFunctions,
        getTableFunctions,
        getWindowFunctions,
        getUdfs,
        getSimpleTypes,
    });
}
