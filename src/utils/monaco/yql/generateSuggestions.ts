import type {YQLEntity} from '@gravity-ui/websql-autocomplete/yql';

import type {
    AutocompleteColumn,
    AutocompleteEntityType,
    TAutocompleteEntity,
} from '../../../types/api/autocomplete';

import {
    AggregateFunctions,
    EntitySettings,
    Pragmas,
    SimpleFunctions,
    SimpleTypes,
    TableFunction,
    Udfs,
    WindowFunctions,
} from './constants';

const suggestionEntityToAutocomplete: Partial<Record<YQLEntity, AutocompleteEntityType[]>> = {
    externalDataSource: ['external_data_source'],
    externalTable: ['external_table'],
    replication: ['replication'],
    table: ['table', 'column_table'],
    tableStore: ['column_store'],
    topic: ['pers_queue_group'],
    view: ['view'],
    tableIndex: ['table_index', 'index'],
    streamingQuery: ['streaming_query'],
};

const commonSuggestionEntities: AutocompleteEntityType[] = ['dir', 'unknown', 'ext_sub_domain'];

const directoryTypes: AutocompleteEntityType[] = ['dir', 'ext_sub_domain'];

export function checkIsDirectory(type: AutocompleteEntityType) {
    return directoryTypes.includes(type);
}

export function filterAutocompleteEntities(
    autocompleteEntities: TAutocompleteEntity[] | undefined,
    suggestions: YQLEntity[],
) {
    const suggestionsSet = suggestions.reduce((acc, el) => {
        const autocompleteEntity = suggestionEntityToAutocomplete[el];
        if (autocompleteEntity) {
            autocompleteEntity.forEach((el) => acc.add(el));
        }
        return acc;
    }, new Set(commonSuggestionEntities));
    return autocompleteEntities?.filter(({Type}) => suggestionsSet.has(Type));
}

export function removeBackticks(value: string) {
    let sliceStart = 0;
    let sliceEnd = value.length;
    if (value.startsWith('`')) {
        sliceStart = 1;
    }
    if (value.endsWith('`')) {
        sliceEnd = -1;
    }
    return value.slice(sliceStart, sliceEnd);
}

function removeStartSlash(value: string) {
    if (value.startsWith('/')) {
        return value.slice(1);
    }
    return value;
}

export function normalizeEntityPrefix(value = '', database: string) {
    const valueWithoutBackticks = removeBackticks(value);
    if (!valueWithoutBackticks.startsWith('/')) {
        return valueWithoutBackticks;
    }
    let cleanedValue = removeStartSlash(valueWithoutBackticks);
    const cleanedDatabase = removeStartSlash(database);
    if (cleanedValue.startsWith(cleanedDatabase)) {
        cleanedValue = cleanedValue.slice(cleanedDatabase.length);
    }
    return removeStartSlash(cleanedValue);
}

export async function getSimpleFunctions() {
    return SimpleFunctions;
}
export async function getWindowFunctions() {
    return WindowFunctions;
}
export async function getTableFunctions() {
    return TableFunction;
}
export async function getAggregateFunctions() {
    return AggregateFunctions;
}
export async function getPragmas() {
    return Pragmas;
}
export async function getEntitySettings(entityType: YQLEntity) {
    return EntitySettings[entityType];
}
export async function getUdfs() {
    return Udfs;
}
export async function getSimpleTypes() {
    return SimpleTypes;
}

export function getColumnDetails(col: AutocompleteColumn) {
    const {PKIndex, NotNull, Default} = col;
    const details = [];
    if (PKIndex !== undefined) {
        details.push(`PK${PKIndex}`);
    }
    if (NotNull) {
        details.push('NN');
    }
    if (Default) {
        details.push('Default');
    }
    const detailsString = details.length ? details.join(', ') : '';
    // return `Column${detailsString}`;
    return detailsString;
}

export function normalizeEntityNames(entities: string[], database: string) {
    return (
        entities.map((entity) => {
            let normalizedEntityName = removeBackticks(entity);
            if (!normalizedEntityName.endsWith('/')) {
                normalizedEntityName = `${normalizedEntityName}/`;
            }
            return normalizeEntityPrefix(normalizedEntityName, database);
        }) ?? []
    );
}
