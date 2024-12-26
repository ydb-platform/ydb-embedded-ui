import type {CursorPosition} from '@gravity-ui/websql-autocomplete/shared';
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
    generateVariableSuggestion,
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
    const {parseYqlQuery} = await import('@gravity-ui/websql-autocomplete/yql');
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
    let variableSuggestions: Monaco.languages.CompletionItem[] = [];

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
    if (parseResult.suggestVariables) {
        variableSuggestions = generateVariableSuggestion(
            rangeToInsertSuggestion,
            parseResult.suggestVariables,
        );
    }
    if (parseResult.suggestUdfs) {
        udfsSuggestions = await generateUdfSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestPragmas) {
        pragmasSuggestions = await generatePragmasSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestEntitySettings) {
        entitySettingsSuggestions = await generateEntitySettingsSuggestion(
            rangeToInsertSuggestion,
            parseResult.suggestEntitySettings,
        );
    }

    const columnAliasSuggestion = await generateColumnAliasesSuggestion(
        rangeToInsertSuggestion,
        parseResult.suggestColumnAliases,
    );

    const columnsSuggestions = await generateColumnsSuggestion(
        rangeToInsertSuggestion,
        parseResult.suggestColumns,
        parseResult.suggestVariables,
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
        ...variableSuggestions,
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
