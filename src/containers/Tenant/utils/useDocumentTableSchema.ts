import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {documentTablesApi} from '../../../store/reducers/documentTables';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import {backend, environment} from '../../../store/runtimeParams';
import type {DocumentTableContext} from '../../../uiFactory/types';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useClusterNameFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {transformPath} from '../ObjectSummary/transformPath';
import type {TenantContextType} from '../TenantContext';

interface UseDocumentTableSchemaParams extends TenantContextType {
    pollingInterval?: number;
    visible?: boolean;
}

export function useDocumentTableDatabase(
    {database, databaseFullPath}: Pick<TenantContextType, 'database' | 'databaseFullPath'>,
    enabled = true,
) {
    const clusterName = useClusterNameFromQuery();
    const {
        databaseData,
        matchedDatabaseData,
        controlPlane,
        error: databaseError,
        isError: isDatabaseError,
    } = useTenantBaseInfo(database, clusterName, {skip: !enabled});

    const currentDatabase =
        enabled && matchedDatabaseData?.Name === databaseFullPath ? matchedDatabaseData : undefined;
    const access = currentDatabase && uiFactory.documentTables?.getDatabaseAccess(currentDatabase);
    const connectionId = access?.connectionId;
    const getTableContext = React.useCallback(
        (path: string): DocumentTableContext | undefined => {
            if (
                !currentDatabase ||
                databaseError ||
                isDatabaseError ||
                !path.startsWith(`${databaseFullPath}/`) ||
                path.length <= databaseFullPath.length + 1
            ) {
                return undefined;
            }
            return {
                database,
                databaseFullPath,
                path,
                relativePath: transformPath(path, databaseFullPath),
                clusterName,
                environment,
                backend,
                connectionId,
            };
        },
        [
            currentDatabase,
            connectionId,
            databaseError,
            isDatabaseError,
            database,
            databaseFullPath,
            clusterName,
        ],
    );

    return {
        getTableContext,
        clusterName,
        controlPlane,
        databaseData: currentDatabase,
        mayHaveDocumentTables: access?.mayHaveDocumentTables,
        databaseLoading: enabled && !databaseData && !isDatabaseError,
        databaseError,
        connectionId: databaseError || isDatabaseError ? undefined : connectionId,
    };
}

export function useDocumentTableContext({path, ...scope}: TenantContextType, enabled: boolean) {
    const {getTableContext, ...metadata} = useDocumentTableDatabase(scope, enabled);
    return {context: getTableContext(path), ...metadata};
}

export function useDocumentTableSchema({
    pollingInterval,
    visible = true,
    ...scope
}: UseDocumentTableSchemaParams) {
    const {context, databaseLoading, databaseError} = useDocumentTableContext(
        scope,
        Boolean(visible && uiFactory.documentTables?.getSchema && scope.database),
    );
    const {currentData, error, isFetching} = documentTablesApi.useGetDocumentTableSchemaQuery(
        context ?? skipToken,
        {pollingInterval},
    );

    const loading = databaseLoading || (isFetching && currentData === undefined);

    return {currentData, loading, error: databaseError ?? error};
}
