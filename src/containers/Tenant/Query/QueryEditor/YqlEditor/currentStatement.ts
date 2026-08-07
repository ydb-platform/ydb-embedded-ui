import {tokenizeYqlQuery} from '@gravity-ui/websql-autocomplete/yql';

const WHITESPACE_TOKEN = 'WS';
const SEMICOLON_TOKEN = 'SEMICOLON';
const ACTION_TOKEN = 'ACTION';
const BEGIN_TOKEN = 'BEGIN';
const DEFINE_TOKEN = 'DEFINE';
const DO_TOKEN = 'DO';
const END_TOKEN = 'END';
const LBRACE_CURLY_TOKEN = 'LBRACE_CURLY';
const RBRACE_CURLY_TOKEN = 'RBRACE_CURLY';
const SUBQUERY_TOKEN = 'SUBQUERY';

const SIMPLE_STATEMENT_UNSAFE_CHARACTER = /[^A-Za-z0-9_$=\s!<>+\-*/%;&|^~?.,:()[\]]/u;
const SIMPLE_STATEMENT_UNSAFE_SEQUENCE = /--|\/\*|\*\//u;
const COMPOUND_STATEMENT_KEYWORD = /\b(?:ACTION|BEGIN|DEFINE|DO|END|SUBQUERY)\b/iu;
const WHITESPACE_CHARACTER = /\s/u;

type CompoundEndToken = typeof DEFINE_TOKEN | typeof DO_TOKEN | typeof RBRACE_CURLY_TOKEN;

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

function canExtractStatementsWithoutTokenizer(query: string): boolean {
    return (
        !SIMPLE_STATEMENT_UNSAFE_CHARACTER.test(query) &&
        !SIMPLE_STATEMENT_UNSAFE_SEQUENCE.test(query) &&
        !COMPOUND_STATEMENT_KEYWORD.test(query)
    );
}

function skipWhitespace(query: string, startIndex: number, endIndex: number): number {
    let index = startIndex;
    while (index < endIndex && WHITESPACE_CHARACTER.test(query[index])) {
        index += 1;
    }
    return index;
}

function trimTrailingWhitespace(query: string, startIndex: number, endIndex: number): number {
    let index = endIndex;
    while (index > startIndex && WHITESPACE_CHARACTER.test(query[index - 1])) {
        index -= 1;
    }
    return index;
}

function extractSimpleStatements(query: string): YqlStatementPosition[] {
    const positions: YqlStatementPosition[] = [];
    let segmentStartIndex = 0;

    for (let index = 0; index < query.length; index += 1) {
        if (query[index] !== ';') {
            continue;
        }

        const statementStartIndex = skipWhitespace(query, segmentStartIndex, index);
        if (statementStartIndex < index) {
            positions.push({startIndex: statementStartIndex, endIndex: index + 1});
        }
        segmentStartIndex = index + 1;
    }

    const statementStartIndex = skipWhitespace(query, segmentStartIndex, query.length);
    const statementEndIndex = trimTrailingWhitespace(query, statementStartIndex, query.length);
    if (statementStartIndex < statementEndIndex) {
        positions.push({startIndex: statementStartIndex, endIndex: statementEndIndex});
    }

    return positions;
}

function extractTokenizedStatements(query: string): YqlStatementPosition[] {
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
        if (ruleName === RBRACE_CURLY_TOKEN && currentCompoundEndToken === RBRACE_CURLY_TOKEN) {
            compoundEndTokens.pop();
        } else if (previousTokenRuleName === END_TOKEN && ruleName === currentCompoundEndToken) {
            compoundEndTokens.pop();
        } else if (ruleName === LBRACE_CURLY_TOKEN) {
            compoundEndTokens.push(RBRACE_CURLY_TOKEN);
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

export function extractYqlStatements(query: string): YqlStatementPosition[] {
    return canExtractStatementsWithoutTokenizer(query)
        ? extractSimpleStatements(query)
        : extractTokenizedStatements(query);
}

export function findYqlStatementAtOffset(
    query: string,
    cursorOffset: number,
    statementPositions: YqlStatementPosition[] = extractYqlStatements(query),
): CurrentYqlStatement | undefined {
    const statementStartingAtCursor = statementPositions.find(
        ({startIndex}) => startIndex === cursorOffset,
    );
    const statement =
        statementStartingAtCursor ??
        statementPositions.find(({startIndex, endIndex}) => {
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
