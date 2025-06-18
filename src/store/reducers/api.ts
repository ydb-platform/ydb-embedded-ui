import type {BaseQueryFn} from '@reduxjs/toolkit/query';
import {createApi} from '@reduxjs/toolkit/query/react';

export const api = createApi({
    baseQuery: fakeBaseQuery(),
    /**
     * This api has endpoints injected in adjacent files,
     * which is why no endpoints are shown below.
     */
    endpoints: () => ({}),
    invalidationBehavior: 'immediately',
    tagTypes: [
        'All',
        'PDiskData',
        'PreviewData',
        'SchemaTree',
        'StorageData',
        'Tablet',
        'UserData',
        'VDiskData',
        'AccessRights',
    ],
});

export const _NEVER = Symbol();
type NEVER = typeof _NEVER;

/**
 * Creates a "fake" baseQuery to be used if your api *only* uses the `queryFn` definition syntax.
 * This also allows you to specify a specific error type to be shared by all your `queryFn` definitions.
 *
 * Can't use fakeBaseQuery from @reduxjs/toolkit/query, because of error
 */
function fakeBaseQuery<ErrorType>(): BaseQueryFn<void, NEVER, ErrorType, {}> {
    return function () {
        throw new Error(
            'When using `fakeBaseQuery`, all queries & mutations must use the `queryFn` definition syntax.',
        );
    };
}
