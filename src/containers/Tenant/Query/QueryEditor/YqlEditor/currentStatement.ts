import {extractYqlStatementPositionsFromQuery} from '@gravity-ui/websql-autocomplete/yql';

export type YqlStatementPosition = ReturnType<
    typeof extractYqlStatementPositionsFromQuery
>['statementPositions'][number];

export interface CurrentYqlStatement extends YqlStatementPosition {
    text: string;
}

export function extractYqlStatements(query: string): YqlStatementPosition[] {
    return extractYqlStatementPositionsFromQuery(query).statementPositions;
}

export function findYqlStatementAtOffset(
    query: string,
    cursorOffset: number,
    statementPositions = extractYqlStatements(query),
): CurrentYqlStatement | undefined {
    const statement = statementPositions.find(({startIndex, endIndex}) => {
        const isInsideStatement = cursorOffset >= startIndex && cursorOffset < endIndex;
        const isImmediatelyAfterTerminatingSemicolon =
            cursorOffset === endIndex && query[endIndex - 1] === ';';

        return isInsideStatement || isImmediatelyAfterTerminatingSemicolon;
    });

    if (!statement) {
        return undefined;
    }

    const text = query.slice(statement.startIndex, statement.endIndex);
    if (!text.trim()) {
        return undefined;
    }

    return {...statement, text};
}
