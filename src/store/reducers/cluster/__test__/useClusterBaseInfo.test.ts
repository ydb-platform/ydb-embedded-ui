import {renderHook} from '@testing-library/react';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import {clusterApi, useClusterBaseInfo} from '../cluster';

jest.mock('../../../../utils/hooks/useDatabaseFromQuery', () => ({
    useClusterNameFromQuery: () => 'test-cluster',
}));
jest.mock('../../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: () => true,
}));

const originalApi = window.api;

afterEach(() => {
    window.api = originalApi;
    jest.restoreAllMocks();
});

test.each([false, true])(
    'waits for cluster metadata only when meta API exists (meta=%s)',
    (hasMeta) => {
        window.api = {meta: hasMeta ? {} : undefined} as unknown as YdbEmbeddedAPI;
        const query = jest.spyOn(clusterApi, 'useGetClusterBaseInfoQuery').mockReturnValue({
            currentData: undefined,
            isSuccess: false,
            isError: false,
            refetch: jest.fn(),
        } as ReturnType<typeof clusterApi.useGetClusterBaseInfoQuery>);

        const {result} = renderHook(() => useClusterBaseInfo());

        expect(query).toHaveBeenCalledWith('test-cluster', {skip: !hasMeta});
        expect(result.current.isResolved).toBe(!hasMeta);
    },
);
