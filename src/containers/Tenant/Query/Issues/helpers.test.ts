import {offsetErrorResponsePositions} from './helpers';

describe('offsetErrorResponsePositions', () => {
    test('offsets root, nested, and end positions', () => {
        const result = offsetErrorResponsePositions(
            {
                error: {
                    position: {row: 1, column: 2},
                    end_position: {row: 2, column: 4},
                    issues: [{position: {row: 1, column: 5}}],
                },
            },
            {lineNumber: 7, column: 3},
        );

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
});
