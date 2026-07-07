import {resolveOperationsRenderState} from '../utils';

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
