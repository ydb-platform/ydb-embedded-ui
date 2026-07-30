import {tokenizeYqlQuery} from '@gravity-ui/websql-autocomplete/yql';

const WHITESPACE_TOKEN = 'WS';
const SEMICOLON_TOKEN = 'SEMICOLON';
const ACTION_TOKEN = 'ACTION';
const BEGIN_TOKEN = 'BEGIN';
const DEFINE_TOKEN = 'DEFINE';
const DO_TOKEN = 'DO';
const END_TOKEN = 'END';
const SUBQUERY_TOKEN = 'SUBQUERY';

type CompoundEndToken = typeof DEFINE_TOKEN | typeof DO_TOKEN;

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
    const compoundEndTokens: CompoundEndToken[] = [];
    let startIndex: number | undefined;
    let lastTokenEndIndex: number | undefined;
    let previousTokenRuleName: string | undefined;

    for (const token of tokens) {
        if (token.ruleName === WHITESPACE_TOKEN) {
            continue;
        }

        const {ruleName} = token;
        const tokenEndIndex = getTokenEndIndex(token);
        const currentCompoundEndToken = compoundEndTokens[compoundEndTokens.length - 1];
        if (previousTokenRuleName === END_TOKEN && ruleName === currentCompoundEndToken) {
            compoundEndTokens.pop();
        } else if (previousTokenRuleName === DO_TOKEN && ruleName === BEGIN_TOKEN) {
            compoundEndTokens.push(DO_TOKEN);
        } else if (
            previousTokenRuleName === DEFINE_TOKEN &&
            (ruleName === ACTION_TOKEN || ruleName === SUBQUERY_TOKEN)
        ) {
            compoundEndTokens.push(DEFINE_TOKEN);
        }

        if (ruleName === SEMICOLON_TOKEN) {
            if (compoundEndTokens.length === 0) {
                if (startIndex !== undefined) {
                    positions.push({startIndex, endIndex: tokenEndIndex});
                }
                startIndex = undefined;
                lastTokenEndIndex = undefined;
            } else {
                lastTokenEndIndex = tokenEndIndex;
            }
            previousTokenRuleName = ruleName;
            continue;
        }

        startIndex ??= token.startIndex;
        lastTokenEndIndex = tokenEndIndex;
        previousTokenRuleName = ruleName;
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
