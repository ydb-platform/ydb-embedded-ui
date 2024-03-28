import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type {
    ColumnAliasSuggestion,
    KeywordSuggestion,
    YqlAutocompleteResult,
} from '@gravity-ui/websql-autocomplete';

import {
    AggregateFunctions,
    Pragmas,
    SimpleFunctions,
    SimpleTypes,
    TableFunction,
    Udfs,
    WindowFunctions,
} from './constants';

const CompletionItemKind: {
    [K in keyof typeof monaco.languages.CompletionItemKind]: typeof monaco.languages.CompletionItemKind[K];
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

function wrapStringToBackticks(value: string) {
    let result = value;
    if (value.match(re)) {
        result = `\`${value}\``;
    }
    return result;
}

function removeBackticks(value: string) {
    let normalizedValue = value;
    if (value.startsWith('`')) {
        normalizedValue = value.slice(1, -1);
    }
    return normalizedValue;
}

type SuggestionType = keyof Omit<YqlAutocompleteResult, 'errors' | 'suggestDatabases'>;

const SuggestionsWeight: Record<SuggestionType, number> = {
    suggestTemplates: 0,
    suggestPragmas: 1,
    suggestEntity: 2,
    suggestColumns: 3,
    suggestColumnAliases: 4,
    suggestKeywords: 5,
    suggestAggregateFunctions: 6,
    suggestTableFunctions: 7,
    suggestWindowFunctions: 8,
    suggestFunctions: 9,
    suggestUdfs: 10,
    suggestSimpleTypes: 11,
};

const KEEP_CACHE_MILLIS = 5 * 60 * 1000;

function getColumnsWithCache() {
    const cache = new Map<string, string[]>();
    return async (path: string) => {
        const normalizedPath = removeBackticks(path);
        const existed = cache.get(path);
        if (existed) {
            return existed;
        }
        const columns = [];
        const data = await window.api.getDescribe({path: normalizedPath});
        if (data?.Status === 'StatusSuccess') {
            const desc = data.PathDescription;
            if (desc?.Table?.Columns) {
                for (const c of desc.Table.Columns) {
                    if (c.Name) {
                        columns.push(c.Name);
                    }
                }
            }
            if (desc?.ColumnTableDescription?.Schema?.Columns) {
                for (const c of desc.ColumnTableDescription.Schema.Columns) {
                    if (c.Name) {
                        columns.push(c.Name);
                    }
                }
            }
            if (desc?.ExternalTableDescription?.Columns) {
                for (const c of desc.ExternalTableDescription.Columns) {
                    if (c.Name) {
                        columns.push(c.Name);
                    }
                }
            }
        }

        cache.set(path, columns);
        setTimeout(() => {
            cache.delete(path);
        }, KEEP_CACHE_MILLIS);
        return columns;
    };
}

const getColumns = getColumnsWithCache();

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
    for (const entity of suggestColumns.tables ?? []) {
        let normalizedEntityName = removeBackticks(entity.name);
        // if it's relative entity path
        if (!normalizedEntityName.startsWith('/')) {
            normalizedEntityName = `${database}/${normalizedEntityName}`;
        }
        const fields = await getColumns(normalizedEntityName);
        fields.forEach((columnName: string) => {
            const normalizedName = wrapStringToBackticks(columnName);
            let columnNameSuggestion = normalizedName;
            if (entity.alias) {
                columnNameSuggestion = `${entity.alias}.${normalizedName}`;
            } else if (multi) {
                // no need to wrap entity.name to backticks, because it's already with them if needed
                columnNameSuggestion = `${entity.name}.${normalizedName}`;
            }
            suggestions.push({
                label: columnNameSuggestion,
                insertText: columnNameSuggestion,
                kind: CompletionItemKind.Field,
                detail: 'Column',
                range: rangeToInsertSuggestion,
                sortText: suggestionIndexToWeight(getSuggestionIndex('suggestColumns')),
            });
        });
    }
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
    _rangeToInsertSuggestion: monaco.IRange,
): Promise<monaco.languages.CompletionItem[]> {
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
