import {renderHook, waitFor} from '@testing-library/react';

import {useOperationsQueryParams} from '../useOperationsQueryParams';

const mockSetQueryParams = jest.fn();
let mockQueryParams: Record<string, string | number | undefined> = {};
let mockAnalyzeOperationAvailable = false;

jest.mock('use-query-params', () => {
    const actual = jest.requireActual('use-query-params');

    return {
        ...actual,
        useQueryParams: () => [mockQueryParams, mockSetQueryParams],
    };
});

jest.mock('../../../store/reducers/capabilities/hooks', () => ({
    useAnalyzeOperationAvailable: () => mockAnalyzeOperationAvailable,
}));

describe('useOperationsQueryParams', () => {
    beforeEach(() => {
        mockSetQueryParams.mockClear();
        mockQueryParams = {};
        mockAnalyzeOperationAvailable = false;
    });

    it('normalizes unavailable analyze kind in URL to build index', async () => {
        mockQueryParams = {kind: 'analyze'};

        const {result} = renderHook(() => useOperationsQueryParams());

        expect(result.current.kind).toBe('buildindex');

        await waitFor(() => {
            expect(mockSetQueryParams).toHaveBeenCalledWith({kind: 'buildindex'}, 'replaceIn');
        });
    });

    it('keeps analyze kind when analyze operations are available', () => {
        mockQueryParams = {kind: 'analyze'};
        mockAnalyzeOperationAvailable = true;

        const {result} = renderHook(() => useOperationsQueryParams());

        expect(result.current.kind).toBe('analyze');
        expect(result.current.analyzeOperationAvailable).toBe(true);
        expect(mockSetQueryParams).not.toHaveBeenCalled();
    });
});
