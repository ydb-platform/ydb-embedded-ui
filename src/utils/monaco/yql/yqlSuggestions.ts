import type {CursorPosition, YQLEntity} from '@gravity-ui/websql-autocomplete';
import type Monaco from 'monaco-editor';

import {
    generateAggregateFunctionsSuggestion,
    generateColumnAliasesSuggestion,
    generateColumnsSuggestion,
    generateEntitiesSuggestion,
    generateEntitySettingsSuggestion,
    generateKeywordsSuggestion,
    generatePragmasSuggestion,
    generateSimpleFunctionsSuggestion,
    generateSimpleTypesSuggestion,
    generateTableFunctionsSuggestion,
    generateUdfSuggestion,
    generateWindowFunctionsSuggestion,
} from './generateSuggestions';

export function createProvideSuggestionsFunction(database: string) {
    return async (
        model: Monaco.editor.ITextModel,
        monacoCursorPosition: Monaco.Position,
        _context: Monaco.languages.CompletionContext,
        _token: Monaco.CancellationToken,
    ) => {
        const rangeToInsertSuggestion = getRangeToInsertSuggestion(model, monacoCursorPosition);

        const suggestions = await getSuggestions(
            model,
            monacoCursorPosition,
            rangeToInsertSuggestion,
            database,
        );

        return {suggestions};
    };
}

function getEntityType(stmt: string): YQLEntity | undefined {
    switch (stmt) {
        case 'create_table_stmt':
            return 'table';
        case 'create_view_stmt':
            return 'view';
        case 'create_topic_stmt':
            return 'topic';
        case 'create_replication_stmt':
            return 'replication';
        case 'create_external_data_source_stmt':
            return 'externalDataSource';
        default:
            return undefined;
    }
}

function getEntityNameAtCursor(model: Monaco.editor.ITextModel, cursorPosition: Monaco.Position) {
    const prevWord = model.findPreviousMatch(
        '\\s(`?[^\\s]*)',
        cursorPosition,
        true,
        false,
        null,
        true,
    );
    const nextWord = model.findNextMatch('([^\\s]*)`?', cursorPosition, true, false, null, true);

    return `${prevWord?.matches?.[1] ?? ''}${nextWord?.matches?.[1] ?? ''}`;
}

async function getSuggestions(
    model: Monaco.editor.ITextModel,
    cursorPosition: Monaco.Position,
    rangeToInsertSuggestion: Monaco.IRange,
    database: string,
): Promise<Monaco.languages.CompletionItem[]> {
    const {parseYqlQuery} = await import('@gravity-ui/websql-autocomplete');
    const cursorForParsing: CursorPosition = {
        line: cursorPosition.lineNumber,
        column: cursorPosition.column,
    };
    const parseResult = parseYqlQuery(model.getValue(), cursorForParsing);
    let entitiesSuggestions: Monaco.languages.CompletionItem[] = [];
    let functionsSuggestions: Monaco.languages.CompletionItem[] = [];
    let aggregateFunctionsSuggestions: Monaco.languages.CompletionItem[] = [];
    let windowFunctionsSuggestions: Monaco.languages.CompletionItem[] = [];
    let tableFunctionsSuggestions: Monaco.languages.CompletionItem[] = [];
    let udfsSuggestions: Monaco.languages.CompletionItem[] = [];
    let simpleTypesSuggestions: Monaco.languages.CompletionItem[] = [];
    let pragmasSuggestions: Monaco.languages.CompletionItem[] = [];
    let entitySettingsSuggestions: Monaco.languages.CompletionItem[] = [];

    if (parseResult.suggestEntity) {
        const entityNamePrefix = getEntityNameAtCursor(model, cursorPosition);

        entitiesSuggestions = await generateEntitiesSuggestion(
            rangeToInsertSuggestion,
            parseResult.suggestEntity,
            database,
            entityNamePrefix,
        );
    }
    if (parseResult.suggestFunctions) {
        functionsSuggestions = await generateSimpleFunctionsSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestAggregateFunctions) {
        aggregateFunctionsSuggestions =
            await generateAggregateFunctionsSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestWindowFunctions) {
        windowFunctionsSuggestions =
            await generateWindowFunctionsSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestTableFunctions) {
        tableFunctionsSuggestions = await generateTableFunctionsSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestSimpleTypes) {
        simpleTypesSuggestions = await generateSimpleTypesSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestUdfs) {
        udfsSuggestions = await generateUdfSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestPragmas) {
        pragmasSuggestions = await generatePragmasSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestTableSettings) {
        const entityType = getEntityType(parseResult.suggestTableSettings);
        if (entityType) {
            entitySettingsSuggestions = await generateEntitySettingsSuggestion(
                rangeToInsertSuggestion,
                entityType,
            );
        }
    }

    const columnAliasSuggestion = await generateColumnAliasesSuggestion(
        rangeToInsertSuggestion,
        parseResult.suggestColumnAliases,
    );

    const columnsSuggestions = await generateColumnsSuggestion(
        rangeToInsertSuggestion,
        parseResult.suggestColumns,
        database,
    );

    const keywordsSuggestions = generateKeywordsSuggestion(
        rangeToInsertSuggestion,
        parseResult.suggestKeywords,
    );

    const suggestions: Monaco.languages.CompletionItem[] = [
        ...entitiesSuggestions,
        ...functionsSuggestions,
        ...windowFunctionsSuggestions,
        ...tableFunctionsSuggestions,
        ...udfsSuggestions,
        ...simpleTypesSuggestions,
        ...pragmasSuggestions,
        ...columnAliasSuggestion,
        ...columnsSuggestions,
        ...keywordsSuggestions,
        ...aggregateFunctionsSuggestions,
        ...entitySettingsSuggestions,
    ];

    return suggestions;
}

function getRangeToInsertSuggestion(
    model: Monaco.editor.ITextModel,
    cursorPosition: Monaco.Position,
): Monaco.IRange {
    const {startColumn: lastWordStartColumn, endColumn: lastWordEndColumn} =
        model.getWordUntilPosition(cursorPosition);
    // https://github.com/microsoft/Monaco-editor/discussions/3639#discussioncomment-5190373 if user already typed "$" sign, it should not be duplicated
    const dollarBeforeLastWordStart =
        model.getLineContent(cursorPosition.lineNumber)[lastWordStartColumn - 2] === '$' ? 1 : 0;
    return {
        startColumn: lastWordStartColumn - dollarBeforeLastWordStart,
        startLineNumber: cursorPosition.lineNumber,
        endColumn: lastWordEndColumn,
        endLineNumber: cursorPosition.lineNumber,
    };
}
