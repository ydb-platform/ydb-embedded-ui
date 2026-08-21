import {renderHook} from '@testing-library/react';

import type {QueryTabState} from '../../../../../store/reducers/query/types';
import createToast from '../../../../../utils/createToast';
import {useUpdateSavedQueryFromTab} from '../useUpdateSavedQueryFromTab';

const mockUpdateSavedQuery = jest.fn();

jest.mock('../../../../../utils/createToast', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../useSavedQueries', () => ({
    useSavedQueries: () => ({updateSavedQuery: mockUpdateSavedQuery}),
}));

const tab: QueryTabState = {
    id: 'tab-1',
    title: 'Report',
    input: 'SELECT new;',
    savedInput: 'SELECT old;',
    savedQueryName: 'Report',
    isDirty: true,
    createdAt: 1,
    updatedAt: 2,
};

describe('useUpdateSavedQueryFromTab', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('updates the saved query using the tab binding', () => {
        mockUpdateSavedQuery.mockReturnValue('updated');
        const {result} = renderHook(() => useUpdateSavedQueryFromTab());

        expect(result.current(tab, 'Renamed report', 'SELECT next;')).toBe(true);
        expect(mockUpdateSavedQuery).toHaveBeenCalledWith(
            'Report',
            'Renamed report',
            'SELECT next;',
            'tab-1',
        );
        expect(createToast).not.toHaveBeenCalled();
    });

    test('does not update an unbound tab', () => {
        const {result} = renderHook(() => useUpdateSavedQueryFromTab());

        expect(result.current({...tab, savedQueryName: undefined}, 'Report', 'SELECT next;')).toBe(
            false,
        );
        expect(mockUpdateSavedQuery).not.toHaveBeenCalled();
        expect(createToast).not.toHaveBeenCalled();
    });

    test.each([
        ['duplicate', 'saved-query-name-exists', 'This name already exists'],
        ['not-found', 'saved-query-not-found', 'Saved query no longer exists'],
    ])('shows an error and returns false for %s', (status, toastName, content) => {
        mockUpdateSavedQuery.mockReturnValue(status);
        const {result} = renderHook(() => useUpdateSavedQueryFromTab());

        expect(result.current(tab, 'Report', 'SELECT next;')).toBe(false);
        expect(createToast).toHaveBeenCalledWith({
            name: toastName,
            title: '',
            content,
            theme: 'danger',
        });
    });
});
