import {NumberParam, StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import type {OperationKind} from '../../types/api/operations';

const operationKindSchema = z
    .enum(['ss/backgrounds', 'export/s3', 'export/yt', 'import/s3', 'buildindex'])
    .catch('buildindex');

export function useOperationsQueryParams() {
    const [queryParams, setQueryParams] = useQueryParams({
        kind: StringParam,
        search: StringParam,
        pageSize: NumberParam,
        pageToken: StringParam,
    });

    const kind = operationKindSchema.parse(queryParams.kind) as OperationKind;
    const searchValue = queryParams.search ?? '';
    const pageSize = queryParams.pageSize ?? undefined;
    const pageToken = queryParams.pageToken ?? undefined;

    const handleKindChange = (value: OperationKind) => {
        setQueryParams({kind: value}, 'replaceIn');
    };

    const handleSearchChange = (value: string) => {
        setQueryParams({search: value || undefined}, 'replaceIn');
    };

    const handlePageSizeChange = (value: number) => {
        setQueryParams({pageSize: value}, 'replaceIn');
    };

    const handlePageTokenChange = (value: string | undefined) => {
        setQueryParams({pageToken: value}, 'replaceIn');
    };

    return {
        kind,
        searchValue,
        pageSize,
        pageToken,
        handleKindChange,
        handleSearchChange,
        handlePageSizeChange,
        handlePageTokenChange,
    };
}
