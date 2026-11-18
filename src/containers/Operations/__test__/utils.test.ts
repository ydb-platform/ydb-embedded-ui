import {
    filterControlPlaneOperations,
    getOperationErrorText,
    resolveOperationsRenderState,
} from '../utils';

describe('resolveOperationsRenderState', () => {
    test('shows error message and keeps table visible when operations are available', () => {
        expect(
            resolveOperationsRenderState({
                hasData: true,
                hasError: true,
                isLoading: false,
            }),
        ).toEqual({
            showEmpty: false,
            showErrorBelowTable: true,
            showFullError: false,
            showTable: true,
        });
    });

    test('replaces table with error message when error happens without operations', () => {
        expect(
            resolveOperationsRenderState({
                hasData: false,
                hasError: true,
                isLoading: false,
            }),
        ).toEqual({
            showEmpty: false,
            showErrorBelowTable: false,
            showFullError: true,
            showTable: false,
        });
    });
});

describe('getOperationErrorText', () => {
    test('preserves nested diagnostics even when a parent message is empty', () => {
        expect(
            getOperationErrorText([
                {
                    message: 'Export failed',
                    issues: [{message: 'Access denied'}, {issues: [{message: 'Bucket policy'}]}],
                },
                {message: 'Second failure'},
            ]),
        ).toBe('Export failed\n  Access denied\n    Bucket policy\nSecond failure');
    });
    test('returns no text for missing or blank issues', () => {
        expect(getOperationErrorText()).toBe('');
        expect(getOperationErrorText([{message: '  ', issues: [{}]}])).toBe('');
    });
});

describe('filterControlPlaneOperations', () => {
    const operations = [
        {id: 'OP-1', controlPlaneStatus: 'ERROR'},
        {id: 'op-2', controlPlaneStatus: 'DONE'},
        {id: 'op-3', controlPlaneStatus: 'PENDING'},
    ];
    test('combines status with case-sensitive ID substring, like cloud-console', () => {
        expect(filterControlPlaneOperations(operations, 'op-', 'DONE')).toEqual([operations[1]]);
        expect(filterControlPlaneOperations(operations, 'op-', 'ERROR')).toEqual([]);
        expect(filterControlPlaneOperations(operations, '', 'PENDING')).toEqual([operations[2]]);
        expect(filterControlPlaneOperations(operations, '', '')).toEqual(operations);
    });
});
