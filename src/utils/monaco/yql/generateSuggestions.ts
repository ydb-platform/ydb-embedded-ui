import type {
    ColumnAliasSuggestion,
    KeywordSuggestion,
    YQLEntity,
    YqlAutocompleteResult,
} from '@gravity-ui/websql-autocomplete';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import type {AutocompleteEntityType, TAutocompleteEntity} from '../../../types/api/autocomplete';

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

const CompletionItemKind: {
    [K in keyof typeof monaco.languages.CompletionItemKind]: (typeof monaco.languages.CompletionItemKind)[K];
} = {
    Method: 0,
    Function: 1,
    Constructor: 2,
    Field: 3,
    Variable: 4,
    Class: 5,
    Struct: 6,
    Interface: 7,
    Module: 8,
    Property: 9,
    Event: 10,
    Operator: 11,
    Unit: 12,
    Value: 13,
    Constant: 14,
    Enum: 15,
    EnumMember: 16,
    Keyword: 17,
    Text: 18,
    Color: 19,
    File: 20,
    Reference: 21,
    Customcolor: 22,
    Folder: 23,
    TypeParameter: 24,
    User: 25,
    Issue: 26,
    Snippet: 27,
};

const re = /[\s'"-/@]/;

const suggestionEntityToAutocomplete: Partial<Record<YQLEntity, AutocompleteEntityType[]>> = {
    externalDataSource: ['external_data_source'],
    externalTable: ['external_table'],
    replication: ['replication'],
    table: ['table', 'column_table'],
    tableStore: ['column_store'],
    topic: ['pers_queue_group'],
    view: ['view'],
    tableIndex: ['table_index', 'index'],
};

const commonSuggestionEntities: AutocompleteEntityType[] = ['dir', 'unknown'];

function filterAutocompleteEntities(
    autocompleteEntities: TAutocompleteEntity[],
    suggestions: YQLEntity[],
) {
    const suggestionsSet = suggestions.reduce((acc, el) => {
        const autocompleteEntity = suggestionEntityToAutocomplete[el];
        if (autocompleteEntity) {
            autocompleteEntity.forEach((el) => acc.add(el));
        }
        return acc;
    }, new Set(commonSuggestionEntities));
    return autocompleteEntities.filter(({Type}) => suggestionsSet.has(Type));
}

function wrapStringToBackticks(value: string) {
    let result = value;
    if (value.match(re)) {
        result = `\`${value}\``;
    }
    return result;
}

function removeBackticks(value: string) {
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

function normalizeEntityPrefix(value = '', database: string) {
    let cleanedValue = removeStartSlash(removeBackticks(value));
    const cleanedDatabase = removeStartSlash(database);
    if (cleanedValue.startsWith(cleanedDatabase)) {
        cleanedValue = cleanedValue.slice(cleanedDatabase.length);
    }
    return removeStartSlash(cleanedValue);
}

type SuggestionType = keyof Omit<YqlAutocompleteResult, 'errors' | 'suggestDatabases'>;

const SuggestionsWeight: Record<SuggestionType, number> = {
    suggestTemplates: 0,
    suggestPragmas: 1,
    suggestEntity: 2,
    suggestColumns: 3,
    suggestColumnAliases: 4,
    suggestTableIndexes: 5,
    suggestTableHints: 6,
    suggestEntitySettings: 7,
    suggestSimpleTypes: 8,
    suggestKeywords: 9,
    suggestAggregateFunctions: 10,
    suggestTableFunctions: 11,
    suggestWindowFunctions: 12,
    suggestFunctions: 13,
    suggestUdfs: 14,
};

function getSuggestionIndex(suggestionType: SuggestionType) {
    return SuggestionsWeight[suggestionType];
}

async function getSimpleFunctions() {
    return SimpleFunctions;
}
async function getWindowFunctions() {
    return WindowFunctions;
}
async function getTableFunctions() {
    return TableFunction;
}
async function getAggregateFunctions() {
    return AggregateFunctions;
}
async function getPragmas() {
    return Pragmas;
}
async function getEntitySettings(entityType: YQLEntity) {
    return EntitySettings[entityType];
}
async function getUdfs() {
    return Udfs;
}
async function getSimpleTypes() {
    return SimpleTypes;
}

export async function generateColumnsSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
    suggestColumns: YqlAutocompleteResult['suggestColumns'] | undefined,
    database: string,
): Promise<monaco.languages.CompletionItem[]> {
    if (!suggestColumns?.tables) {
        return [];
    }
    const suggestions: monaco.languages.CompletionItem[] = [];
    const multi = suggestColumns.tables.length > 1;

    const normalizedTableNames =
        suggestColumns.tables?.map((entity) => {
            let normalizedEntityName = removeBackticks(entity.name);
            if (!normalizedEntityName.endsWith('/')) {
                normalizedEntityName = `${normalizedEntityName}/`;
            }
            return normalizeEntityPrefix(normalizedEntityName, database);
        }) ?? [];

    // remove duplicates if any
    const filteredTableNames = Array.from(new Set(normalizedTableNames));

    const autocompleteResponse = await window.api.autocomplete({
        database,
        table: filteredTableNames,
        limit: 1000,
    });
    if (!autocompleteResponse.Success) {
        return [];
    }

    const tableNameToAliasMap = suggestColumns.tables?.reduce(
        (acc, entity) => {
            const normalizedEntityName = normalizeEntityPrefix(
                removeBackticks(entity.name),
                database,
            );
            const aliases = acc[normalizedEntityName] ?? [];
            if (entity.alias) {
                aliases.push(entity.alias);
            }
            acc[normalizedEntityName] = aliases;
            return acc;
        },
        {} as Record<string, string[]>,
    );

    autocompleteResponse.Result.Entities.forEach((col) => {
        if (col.Type !== 'column') {
            return;
        }
        const normalizedName = wrapStringToBackticks(col.Name);

        const normalizedParentName = normalizeEntityPrefix(col.Parent, database);
        const aliases = tableNameToAliasMap[normalizedParentName];
        if (aliases?.length) {
            aliases.forEach((a) => {
                const columnNameSuggestion = `${a}.${normalizedName}`;
                suggestions.push({
                    label: columnNameSuggestion,
                    insertText: columnNameSuggestion,
                    kind: CompletionItemKind.Field,
                    detail: 'Column',
                    range: rangeToInsertSuggestion,
                    sortText: suggestionIndexToWeight(getSuggestionIndex('suggestColumns')),
                });
            });
        } else {
            let columnNameSuggestion = normalizedName;
            if (multi) {
                columnNameSuggestion = `${wrapStringToBackticks(normalizedParentName)}.${normalizedName}`;
            }
            suggestions.push({
                label: columnNameSuggestion,
                insertText: columnNameSuggestion,
                kind: CompletionItemKind.Field,
                detail: 'Column',
                range: rangeToInsertSuggestion,
                sortText: suggestionIndexToWeight(getSuggestionIndex('suggestColumns')),
            });
        }
    });
    return suggestions;
}

export function generateColumnAliasesSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
    suggestColumnAliases?: ColumnAliasSuggestion[],
) {
    if (!suggestColumnAliases) {
        return [];
    }
    return suggestColumnAliases?.map((columnAliasSuggestion) => ({
        label: columnAliasSuggestion.name,
        insertText: columnAliasSuggestion.name,
        kind: CompletionItemKind.Field,
        detail: 'Column alias',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestColumnAliases')),
    }));
}
export function generateKeywordsSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
    suggestKeywords?: KeywordSuggestion[],
) {
    if (!suggestKeywords) {
        return [];
    }
    return suggestKeywords?.map((keywordSuggestion) => ({
        label: keywordSuggestion.value,
        insertText: keywordSuggestion.value,
        kind: CompletionItemKind.Keyword,
        detail: 'Keyword',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestKeywords')),
    }));
}

export async function generateEntitiesSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
    suggestEntities: YQLEntity[],
    database: string,
    prefix?: string,
): Promise<monaco.languages.CompletionItem[]> {
    const normalizedPrefix = normalizeEntityPrefix(prefix, database);
    const data = await window.api.autocomplete({database, prefix: normalizedPrefix, limit: 1000});
    const withBackticks = prefix?.startsWith('`');
    if (data.Success) {
        const filteredEntities = filterAutocompleteEntities(data.Result.Entities, suggestEntities);
        return filteredEntities.reduce((acc, {Name, Type}) => {
            const isDir = Type === 'dir';
            const label = isDir ? `${Name}/` : Name;
            let labelAsSnippet;
            if (isDir && !withBackticks) {
                labelAsSnippet = `\`${label}$0\``;
            }
            acc.push({
                label,
                insertText: labelAsSnippet ?? label,
                kind: isDir ? CompletionItemKind.Folder : CompletionItemKind.Text,
                insertTextRules: labelAsSnippet
                    ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                    : monaco.languages.CompletionItemInsertTextRule.None,
                detail: Type,
                range: rangeToInsertSuggestion,
                command: label.endsWith('/')
                    ? {id: 'editor.action.triggerSuggest', title: ''}
                    : undefined,
                sortText: suggestionIndexToWeight(getSuggestionIndex('suggestEntity')),
            });
            return acc;
        }, [] as monaco.languages.CompletionItem[]);
    }
    return [];
}
export async function generateSimpleFunctionsSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
    const functions = await getSimpleFunctions();
    return functions.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.Function,
        detail: 'Function',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestFunctions')),
    }));
}
export async function generateSimpleTypesSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
    const simpleTypes = await getSimpleTypes();
    return simpleTypes.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.TypeParameter,
        detail: 'Type',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestSimpleTypes')),
    }));
}
export async function generateUdfSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
    const udfs = await getUdfs();
    return udfs.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.Function,
        detail: 'UDF',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestUdfs')),
    }));
}
export async function generateWindowFunctionsSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
    const windowFunctions = await getWindowFunctions();
    return windowFunctions.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.Function,
        detail: 'Window function',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestWindowFunctions')),
    }));
}
export async function generateTableFunctionsSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
    const tableFunctions = await getTableFunctions();
    return tableFunctions.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.Function,
        detail: 'Table function',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestTableFunctions')),
    }));
}
export async function generateAggregateFunctionsSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
    const aggreagteFunctions = await getAggregateFunctions();
    return aggreagteFunctions.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.Function,
        detail: 'Aggregate function',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestAggregateFunctions')),
    }));
}
export async function generatePragmasSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
    const pragmas = await getPragmas();
    return pragmas.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.Module,
        detail: 'Pragma',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestPragmas')),
    }));
}
export async function generateEntitySettingsSuggestion(
    rangeToInsertSuggestion: monaco.IRange,
    entityType: YQLEntity,
): Promise<monaco.languages.CompletionItem[]> {
    const tableHints = await getEntitySettings(entityType);
    return tableHints.map((el) => ({
        label: el,
        insertText: el,
        kind: CompletionItemKind.Property,
        detail: 'Setting',
        range: rangeToInsertSuggestion,
        sortText: suggestionIndexToWeight(getSuggestionIndex('suggestEntitySettings')),
    }));
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz';

function suggestionIndexToWeight(index: number): string {
    const characterInsideAlphabet = alphabet[index];
    if (characterInsideAlphabet) {
        return characterInsideAlphabet;
    }

    const duplicateTimes = Math.floor(index / alphabet.length);
    const remains = index % alphabet.length;

    const lastCharacter = alphabet.slice(-1);

    return lastCharacter.repeat(duplicateTimes) + alphabet[remains];
}
