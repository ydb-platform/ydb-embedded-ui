import {extractYqlStatements, findYqlStatementAtOffset} from './currentStatement';

describe('current YQL statement', () => {
    test.each([
        ['; SELECT 1;', ['SELECT 1;']],
        ['SELECT 1;;; SELECT 2;', ['SELECT 1;', 'SELECT 2;']],
    ])('filters empty separator statements from %s', (query, expectedStatements) => {
        const statements = extractYqlStatements(query);

        expect(
            statements.map(({startIndex, endIndex}) => query.slice(startIndex, endIndex)),
        ).toEqual(expectedStatements);
    });

    test('finds each statement and excludes whitespace between statements', () => {
        const query = 'SELECT 1;\n\nSELECT 2;';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, 2, statements)?.text).toBe('SELECT 1;');
        expect(findYqlStatementAtOffset(query, query.indexOf('SELECT 2'), statements)?.text).toBe(
            'SELECT 2;',
        );
        expect(
            findYqlStatementAtOffset(query, query.indexOf('\n\n') + 1, statements),
        ).toBeUndefined();
    });

    test('does not split semicolons inside strings and comments', () => {
        const query = '/* ignored; */ SELECT "a;b";\n-- gap;\nSELECT 2;';
        const statements = extractYqlStatements(query);

        expect(
            statements.map(({startIndex, endIndex}) => query.slice(startIndex, endIndex)),
        ).toEqual(['SELECT "a;b";', 'SELECT 2;']);
    });

    test.each([
        [
            'anonymous action',
            'SELECT 0;\nDO BEGIN\n    SELECT 1;\n    SELECT 2;\nEND DO;\nSELECT 3;',
            ['SELECT 0;', 'DO BEGIN\n    SELECT 1;\n    SELECT 2;\nEND DO;', 'SELECT 3;'],
        ],
        [
            'action definition',
            'DEFINE ACTION $a() AS DO BEGIN SELECT 1; SELECT 2; END DO; END DEFINE;\nDO $a();',
            ['DEFINE ACTION $a() AS DO BEGIN SELECT 1; SELECT 2; END DO; END DEFINE;', 'DO $a();'],
        ],
        [
            'subquery definition',
            'DEFINE SUBQUERY $s() AS SELECT 1; SELECT 2; END DEFINE;\nSELECT 3;',
            ['DEFINE SUBQUERY $s() AS SELECT 1; SELECT 2; END DEFINE;', 'SELECT 3;'],
        ],
        [
            'streaming query body',
            'CREATE STREAMING QUERY q AS DO BEGIN INSERT INTO sink SELECT * FROM source; END DO;',
            ['CREATE STREAMING QUERY q AS DO BEGIN INSERT INTO sink SELECT * FROM source; END DO;'],
        ],
    ])('keeps each %s intact', (_name, query, expectedStatements) => {
        const statements = extractYqlStatements(query);

        expect(
            statements.map(({startIndex, endIndex}) => query.slice(startIndex, endIndex)),
        ).toEqual(expectedStatements);
    });

    test('keeps a lambda definition separate from the following statement', () => {
        const query = `$l = ($x) -> {
    return [
        <|
            offset:$x._offset,
            message:$x._data
        |>
    ];
};

ALTER TRANSFER transfer
SET USING $l;`;
        const statements = extractYqlStatements(query);

        expect(
            statements.map(({startIndex, endIndex}) => query.slice(startIndex, endIndex)),
        ).toEqual([
            `$l = ($x) -> {
    return [
        <|
            offset:$x._offset,
            message:$x._data
        |>
    ];
};`,
            `ALTER TRANSFER transfer
SET USING $l;`,
        ]);
    });

    test('extracts a large flat script without recursive parsing', () => {
        const query = new Array(400).fill('SELECT 1;').join('');
        const statements = extractYqlStatements(query);

        expect(statements).toHaveLength(400);
        expect(query.slice(statements[0].startIndex, statements[0].endIndex)).toBe('SELECT 1;');
        expect(query.slice(statements[399].startIndex, statements[399].endIndex)).toBe('SELECT 1;');
    });

    test('distinguishes statements on the same line', () => {
        const query = 'SELECT 1; SELECT 2;';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, query.indexOf('1'), statements)?.text).toBe(
            'SELECT 1;',
        );
        expect(findYqlStatementAtOffset(query, query.indexOf('2'), statements)?.text).toBe(
            'SELECT 2;',
        );
    });

    test('uses JavaScript offsets correctly with Unicode', () => {
        const query = 'SELECT "😀;";\nSELECT 2;';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, query.indexOf('SELECT 2'), statements)?.text).toBe(
            'SELECT 2;',
        );
    });

    test('returns the recoverable incomplete statement', () => {
        const query = 'SELECT 1;\nSEL';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, query.length - 1, statements)?.text).toBe('SEL');
    });

    test('finds a multiline statement', () => {
        const query = 'SELECT\n    1;\n\nSELECT 2;';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, query.indexOf('1'), statements)?.text).toBe(
            'SELECT\n    1;',
        );
    });

    test('returns no statement for standalone comments', () => {
        const query = '-- comment only\n/* another comment */';
        const statements = extractYqlStatements(query);

        expect(
            findYqlStatementAtOffset(query, query.indexOf('comment'), statements),
        ).toBeUndefined();
    });

    test('includes the exact end of a semicolon-terminated statement', () => {
        const query = 'SELECT 1;';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, query.length, statements)?.text).toBe('SELECT 1;');
    });

    test('does not skip whitespace after the terminating semicolon', () => {
        const query = 'SELECT 1; ';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, query.length, statements)).toBeUndefined();
    });

    test('keeps an unterminated statement end exclusive', () => {
        const query = 'SELECT 1';
        const statements = extractYqlStatements(query);

        expect(findYqlStatementAtOffset(query, query.length, statements)).toBeUndefined();
    });
});
