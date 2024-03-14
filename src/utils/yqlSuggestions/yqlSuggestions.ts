import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {CursorPosition, parseYqlQuery} from '@gravity-ui/websql-autocomplete';

import {
    generateAggregateFunctionsSuggestion,
    generateColumnAliasesSuggestion,
    generateColumnsSuggestion,
    generateEntitiesSuggestion,
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
        model: monaco.editor.ITextModel,
        monacoCursorPosition: monaco.Position,
        _context: monaco.languages.CompletionContext,
        _token: monaco.CancellationToken,
    ) => {
        const cursorPosition: CursorPosition = {
            line: monacoCursorPosition.lineNumber,
            column: monacoCursorPosition.column,
        };
        const rangeToInsertSuggestion = getRangeToInsertSuggestion(model, monacoCursorPosition);

        const suggestions = await getSuggestions(
            model,
            cursorPosition,
            rangeToInsertSuggestion,
            database,
        );

        return {suggestions};
    };
}

async function getSuggestions(
    model: monaco.editor.ITextModel,
    cursorPosition: CursorPosition,
    rangeToInsertSuggestion: monaco.IRange,
    database: string,
): Promise<monaco.languages.CompletionItem[]> {
    const parseResult = parseYqlQuery(model.getValue(), cursorPosition);
    let entitiesSuggestions: monaco.languages.CompletionItem[] = [];
    let functionsSuggestions: monaco.languages.CompletionItem[] = [];
    let aggregateFunctionsSuggestions: monaco.languages.CompletionItem[] = [];
    let windowFunctionsSuggestions: monaco.languages.CompletionItem[] = [];
    let tableFunctionsSuggestions: monaco.languages.CompletionItem[] = [];
    let udfsSuggestions: monaco.languages.CompletionItem[] = [];
    let simpleTypesSuggestions: monaco.languages.CompletionItem[] = [];
    let pragmasSuggestions: monaco.languages.CompletionItem[] = [];

    if (parseResult.suggestEntity) {
        entitiesSuggestions = await generateEntitiesSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestFunctions) {
        functionsSuggestions = await generateSimpleFunctionsSuggestion(rangeToInsertSuggestion);
    }
    if (parseResult.suggestAggregateFunctions) {
        aggregateFunctionsSuggestions = await generateAggregateFunctionsSuggestion(
            rangeToInsertSuggestion,
        );
    }
    if (parseResult.suggestWindowFunctions) {
        windowFunctionsSuggestions = await generateWindowFunctionsSuggestion(
            rangeToInsertSuggestion,
        );
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

    const suggestions: monaco.languages.CompletionItem[] = [
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
    ];

    return suggestions;
}

function getRangeToInsertSuggestion(
    model: monaco.editor.ITextModel,
    cursorPosition: monaco.Position,
): monaco.IRange {
    const {startColumn: lastWordStartColumn, endColumn: lastWordEndColumn} =
        model.getWordUntilPosition(cursorPosition);
    // https://github.com/microsoft/monaco-editor/discussions/3639#discussioncomment-5190373 if user already typed "$" sign, it should not be duplicated
    const dollarBeforeLastWordStart =
        model.getLineContent(cursorPosition.lineNumber)[lastWordStartColumn - 2] === '$' ? 1 : 0;
    return {
        startColumn: lastWordStartColumn - dollarBeforeLastWordStart,
        startLineNumber: cursorPosition.lineNumber,
        endColumn: lastWordEndColumn,
        endLineNumber: cursorPosition.lineNumber,
    };
}
