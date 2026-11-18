import {renderHook} from '@testing-library/react';

import {useDatabaseHealthcheckAvailable} from '../useDatabaseHealthcheckAvailable';

let mockPermission: boolean | undefined;

jest.mock('../useIsUserAllowedToMakeChanges', () => ({
    useIsUserAllowedToMakeChanges: () => mockPermission,
}));

test('distinguishes pending healthcheck permissions from an explicit denial', () => {
    mockPermission = undefined;
    const {result, rerender} = renderHook(() => useDatabaseHealthcheckAvailable('Dedicated'));
    expect(result.current).toBeUndefined();

    mockPermission = false;
    rerender();
    expect(result.current).toBe(false);

    mockPermission = true;
    rerender();
    expect(result.current).toBe(true);
});
