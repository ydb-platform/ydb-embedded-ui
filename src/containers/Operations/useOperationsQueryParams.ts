import React from 'react';

import {NumberParam, StringParam, useQueryParams} from 'use-query-params';
import {z} from 'zod';

import {useAnalyzeOperationAvailable} from '../../store/reducers/capabilities/hooks';
import type {OperationKind} from '../../types/api/operations';

const operationKindSchema = z
    .enum([
        'ss/backgrounds',
        'export',
        'export/s3',
        'export/yt',
        'export/nfs',
        'import/s3',
        'import/nfs',
        'buildindex',
        'analyze',
        'compaction',
        'incbackup',
        'restore',
    ])
    .catch('buildindex');

export function useOperationsQueryParams() {
    const analyzeOperationAvailable = useAnalyzeOperationAvailable();
    const [queryParams, setQueryParams] = useQueryParams({
        kind: StringParam,
        search: StringParam,
        operationId: StringParam,
        operationStatus: StringParam,
        pageSize: NumberParam,
        pageToken: StringParam,
    });

    const queryKind = operationKindSchema.parse(queryParams.kind) as OperationKind;
    const kind = queryKind === 'analyze' && !analyzeOperationAvailable ? 'buildindex' : queryKind;
    const controlPlaneSearch = queryParams.operationId ?? '';
    const controlPlaneStatus = z
        .enum(['DONE', 'PENDING', 'ERROR', ''])
        .catch('')
        .parse(queryParams.operationStatus);
    const searchValue = queryParams.search ?? '';
    const pageSize = queryParams.pageSize ?? undefined;
    const pageToken = queryParams.pageToken ?? undefined;

    React.useEffect(() => {
        if (queryKind !== kind) {
            setQueryParams({kind}, 'replaceIn');
        }
    }, [kind, queryKind, setQueryParams]);

    const handleKindChange = React.useCallback(
        (value: OperationKind) => {
            setQueryParams({kind: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleSearchChange = React.useCallback(
        (value: string) => {
            setQueryParams({search: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handlePageSizeChange = React.useCallback(
        (value: number) => {
            setQueryParams({pageSize: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handlePageTokenChange = React.useCallback(
        (value: string | undefined) => {
            setQueryParams({pageToken: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleControlPlaneSearchChange = (value: string) =>
        setQueryParams({operationId: value || undefined}, 'replaceIn');
    const handleControlPlaneStatusChange = (value: string) =>
        setQueryParams({operationStatus: value || undefined}, 'replaceIn');

    return {
        controlPlaneSearch,
        controlPlaneStatus,
        handleControlPlaneSearchChange,
        handleControlPlaneStatusChange,
        kind,
        analyzeOperationAvailable,
        searchValue,
        pageSize,
        pageToken,
        handleKindChange,
        handleSearchChange,
        handlePageSizeChange,
        handlePageTokenChange,
    };
}
