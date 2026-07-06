import {resolveOperationQueryState, resolveOperationsRenderState} from '../utils';

describe('resolveOperationQueryState', () => {
    test('waits for analyze capability before falling back to buildindex', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'analyze',
                analyzeOperationAvailable: false,
                capabilitiesLoaded: false,
            }),
        ).toEqual({
            kind: 'analyze',
            skipQuery: true,
        });
    });

    test('falls back from analyze to buildindex after capabilities load without analyze support', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'analyze',
                analyzeOperationAvailable: false,
                capabilitiesLoaded: true,
            }),
        ).toEqual({
            kind: 'buildindex',
            skipQuery: false,
        });
    });

    test('keeps analyze after capabilities confirm analyze support', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'analyze',
                analyzeOperationAvailable: true,
                capabilitiesLoaded: true,
            }),
        ).toEqual({
            kind: 'analyze',
            skipQuery: false,
        });
    });

    test('does not wait for capabilities for other operation kinds', () => {
        expect(
            resolveOperationQueryState({
                queryKind: 'export/s3',
                analyzeOperationAvailable: false,
                capabilitiesLoaded: false,
            }),
        ).toEqual({
            kind: 'export/s3',
            skipQuery: false,
        });
    });
});

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
