import {useClusterWithProxy} from '../../../../store/reducers/cluster/cluster';
import {useGetOverviewQuery} from '../../../../store/reducers/overview/overview';
import {uiFactory} from '../../../../uiFactory/uiFactory';
import {transformPath} from '../../ObjectSummary/transformPath';
import {isDocumentTable} from '../../utils';
import {isRowTableType} from '../../utils/schema';
import {useDocumentTableContext} from '../../utils/useDocumentTableSchema';

import type {DocumentPreviewProps, PreviewContainerProps, PreviewDescriptionState} from './types';

export function useDocumentPreview({
    database,
    databaseFullPath,
    path: selectedPath,
    type,
}: PreviewContainerProps): {
    documentPreview?: DocumentPreviewProps;
    descriptionState?: PreviewDescriptionState;
} {
    const useMetaProxy = useClusterWithProxy();
    const enabled = Boolean(uiFactory.documentTables?.getPreview);
    const {currentData, error, isFetching, isUninitialized} = useGetOverviewQuery(
        {database, databaseFullPath, path: selectedPath, useMetaProxy},
        {skip: !enabled},
    );

    const description = currentData?.PathDescription;
    const path = currentData?.Path || selectedPath;
    const {context, mayHaveDocumentTables, databaseError, databaseLoading} =
        useDocumentTableContext({database, databaseFullPath, path}, enabled);

    if (!enabled) {
        return {};
    }
    if (isDocumentTable(description)) {
        return {
            documentPreview: {
                context,
                path: transformPath(path, databaseFullPath),
                error: databaseError ?? error,
                loading: databaseLoading,
            },
        };
    }

    if (
        mayHaveDocumentTables !== false &&
        selectedPath !== databaseFullPath &&
        !description?.Self?.PathType &&
        (!type || isRowTableType(type))
    ) {
        const loading = isFetching || isUninitialized;
        return {descriptionState: {loading, error: loading ? undefined : error}};
    }

    return {};
}
