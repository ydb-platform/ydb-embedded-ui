import {tokenizeYqlQuery} from '@gravity-ui/websql-autocomplete/yql';

const WHITESPACE_TOKEN = 'WS';
const SEMICOLON_TOKEN = 'SEMICOLON';

export interface YqlStatementPosition {
    startIndex: number;
    endIndex: number;
}

export interface CurrentYqlStatement extends YqlStatementPosition {
    text: string;
}

type YqlToken = ReturnType<typeof tokenizeYqlQuery>['tokens'][number];

function getTokenEndIndex(token: YqlToken): number {
    return token.startIndex + Array.from(token.text ?? '').length;
}

function normalizeStatementPositions(
    query: string,
    positions: YqlStatementPosition[],
): YqlStatementPosition[] {
    const codeUnitOffsets = [0];
    let codeUnitOffset = 0;
    for (const character of query) {
        codeUnitOffset += character.length;
        codeUnitOffsets.push(codeUnitOffset);
    }

    return positions.map(({startIndex, endIndex}) => ({
        startIndex: codeUnitOffsets[startIndex] ?? query.length,
        endIndex: codeUnitOffsets[endIndex] ?? query.length,
    }));
}

export function extractYqlStatements(query: string): YqlStatementPosition[] {
    let tokens: ReturnType<typeof tokenizeYqlQuery>['tokens'];
    try {
        ({tokens} = tokenizeYqlQuery(query));
    } catch {
        return [];
    }

    const positions: YqlStatementPosition[] = [];
    let startIndex: number | undefined;
    let lastTokenEndIndex: number | undefined;

    for (const token of tokens) {
        if (token.ruleName === WHITESPACE_TOKEN) {
            continue;
        }

        const tokenEndIndex = getTokenEndIndex(token);
        if (token.ruleName === SEMICOLON_TOKEN) {
            if (startIndex !== undefined) {
                positions.push({startIndex, endIndex: tokenEndIndex});
            }
            startIndex = undefined;
            lastTokenEndIndex = undefined;
            continue;
        }

        startIndex ??= token.startIndex;
        lastTokenEndIndex = tokenEndIndex;
    }

    if (startIndex !== undefined && lastTokenEndIndex !== undefined) {
        positions.push({startIndex, endIndex: lastTokenEndIndex});
    }

    return normalizeStatementPositions(query, positions);
}

export function findYqlStatementAtOffset(
    query: string,
    cursorOffset: number,
    statementPositions: YqlStatementPosition[] = extractYqlStatements(query),
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
