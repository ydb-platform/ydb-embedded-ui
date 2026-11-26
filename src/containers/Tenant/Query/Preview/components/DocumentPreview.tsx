import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {Loader} from '../../../../../components/Loader';
import {QueryResultTable} from '../../../../../components/QueryResultTable';
import {documentTablesApi} from '../../../../../store/reducers/documentTables';
import {disableFullscreen} from '../../../../../store/reducers/fullscreen';
import {previewApi} from '../../../../../store/reducers/preview';
import {useTypedDispatch} from '../../../../../utils/hooks';
import tenantKeyset from '../../../i18n';
import queryI18n from '../../i18n';
import {b} from '../shared';
import type {DocumentPreviewProps} from '../types';

import {Preview} from './PreviewView';
import {TablePreview} from './TablePreview';

export function DocumentPreview({
    context,
    path,
    loading: databaseLoading,
    error: databaseError,
}: DocumentPreviewProps) {
    const dispatch = useTypedDispatch();
    const {currentData, error, isFetching} = previewApi.useGetDocumentTablePreviewQuery(
        context ?? skipToken,
        {refetchOnMountOrArgChange: true},
    );

    const {currentData: schema} = documentTablesApi.useGetDocumentTableSchemaQuery(
        context ?? skipToken,
    );
    const declaredColumnNames = React.useMemo(
        () => schema?.attributes.map(({name}) => name),
        [schema],
    );

    React.useEffect(() => {
        return () => {
            dispatch(disableFullscreen());
        };
    }, [dispatch]);

    if (
        currentData === null &&
        context &&
        !databaseLoading &&
        !isFetching &&
        !databaseError &&
        !error
    ) {
        return (
            <TablePreview
                database={context.database}
                databaseFullPath={context.databaseFullPath}
                path={context.path}
                description={tenantKeyset('context_underlying-document-table')}
            />
        );
    }

    const renderResult = () => {
        if (databaseLoading || (isFetching && !currentData)) {
            return <Loader />;
        }

        if (currentData) {
            return (
                <QueryResultTable
                    data={currentData.items}
                    sparseRows
                    declaredColumnNames={declaredColumnNames}
                />
            );
        }

        return (
            <div className={b('message-container')}>
                {queryI18n('context_query-preview-unavailable')}
            </div>
        );
    };

    return (
        <Preview
            path={path}
            quantity={currentData?.items.length ?? null}
            truncated={currentData?.truncated}
            error={databaseError ?? error}
            renderResult={renderResult}
        />
    );
}
