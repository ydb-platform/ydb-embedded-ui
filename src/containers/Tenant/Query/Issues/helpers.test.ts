import type {ErrorResponse} from '../../../../types/api/query';

import {offsetErrorResponsePositions} from './helpers';

describe('offsetErrorResponsePositions', () => {
    test('offsets root, nested, and end positions', () => {
        const error = {
            error: {
                position: {row: 3, column: 2},
                end_position: {row: 4, column: 4},
                issues: [{position: {row: 3, column: 5}}],
            },
        };
        const result = offsetErrorResponsePositions(error, {
            lineNumber: 7,
            column: 3,
            preparedQueryPrefixLineCount: 2,
        });

        expect(error).toEqual({
            error: {
                position: {row: 3, column: 2},
                end_position: {row: 4, column: 4},
                issues: [{position: {row: 3, column: 5}}],
            },
        });
        expect(result).not.toBe(error);
        expect(result.error).not.toBe(error.error);
        expect(result.error?.position).not.toBe(error.error.position);
        expect(result.error?.issues).not.toBe(error.error.issues);
        expect(result.error?.issues?.[0]).not.toBe(error.error.issues[0]);

        expect(result.error?.position).toEqual({row: 7, column: 4});
        expect(result.error?.end_position).toEqual({row: 8, column: 4});
        expect(result.error?.issues?.[0]?.position).toEqual({row: 7, column: 7});
    });

    test('returns an equivalent clone when no positions are present', () => {
        expect(
            offsetErrorResponsePositions(
                {issues: [{message: 'failed'}]},
                {lineNumber: 2, column: 1},
            ),
        ).toEqual({issues: [{message: 'failed'}]});
    });

    test('preserves nullable issues', () => {
        expect(
            offsetErrorResponsePositions(
                {issues: null},
                {lineNumber: 2, column: 1, preparedQueryPrefixLineCount: 2},
            ),
        ).toEqual({issues: null});
    });

    test('preserves nested nullable issues', () => {
        const error = {error: {issues: null}} as unknown as ErrorResponse;

        const result = offsetErrorResponsePositions(error, {
            lineNumber: 2,
            column: 1,
            preparedQueryPrefixLineCount: 2,
        });

        expect(result.error).not.toBe(error.error);
        expect(result.error?.issues).toBeNull();
        expect(error.error?.issues).toBeNull();
    });

    test('preserves nonnumeric positions', () => {
        const position = {row: 'unknown' as unknown as number, column: 2};
        const error = {error: {position}};

        const result = offsetErrorResponsePositions(error, {
            lineNumber: 2,
            column: 1,
            preparedQueryPrefixLineCount: 2,
        });

        expect(result.error?.position).toBe(position);
        expect(error.error.position).toBe(position);
    });

    test('marks positions reported inside the prepared query prefix as non-editor positions', () => {
        const error = {
            error: {
                position: {row: 1, column: 4},
                end_position: {row: 2, column: 1},
                issues: [{position: {row: 2, column: 3}}],
            },
        };

        const result = offsetErrorResponsePositions(error, {
            lineNumber: 1,
            column: 1,
            preparedQueryPrefixLineCount: 2,
        });

        expect(result.error?.position).toEqual({
            row: 1,
            column: 4,
            file: 'query-settings-pragmas',
        });
        expect(result.error?.end_position).toEqual({
            row: 2,
            column: 1,
            file: 'query-settings-pragmas',
        });
        expect(result.error?.issues?.[0]?.position).toEqual({
            row: 2,
            column: 3,
            file: 'query-settings-pragmas',
        });
    });
});
