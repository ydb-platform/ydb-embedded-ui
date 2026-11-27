import React from 'react';

import {Text} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../../../components/TableSkeleton/TableSkeleton';
import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {useAutoRefreshInterval} from '../../../../utils/hooks';
import tenantKeyset from '../../i18n';
import {useDocumentTableSchema} from '../../utils/useDocumentTableSchema';

import {KeysView} from './KeysView';
import {SCHEMA_COLUMNS_WIDTH_LS_KEY, getDocumentTableColumns} from './columns';
import i18n from './i18n';
import {prepareDocumentTableSchema} from './prepareData';
import {b} from './shared';

interface DocumentTableSchemaViewerProps {
    path: string;
    databaseFullPath: string;
    database: string;
    extended: boolean;
    visible: boolean;
    children: React.ReactNode;
}

export function DocumentTableSchemaViewer({
    path,
    databaseFullPath,
    database,
    extended,
    visible,
    children,
}: DocumentTableSchemaViewerProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, error, loading} = useDocumentTableSchema({
        database,
        databaseFullPath,
        path,
        visible,
        pollingInterval: extended ? autoRefreshInterval : undefined,
    });

    const tableData = React.useMemo(() => prepareDocumentTableSchema(currentData), [currentData]);
    const columns = React.useMemo(() => getDocumentTableColumns(tableData), [tableData]);

    if (loading) {
        return <TableSkeleton />;
    }
    const schemaError = error ? <ResponseError error={error} /> : null;
    if (schemaError && currentData === undefined) {
        return schemaError;
    }
    if (currentData === null) {
        return (
            <React.Fragment>
                {schemaError}
                <Text as="p" color="secondary" className={b('description')}>
                    {tenantKeyset('context_underlying-document-table')}
                </Text>
                {children}
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            {schemaError}
            <div className={b('keys-wrapper')}>
                <KeysView tableData={tableData} extended={extended} type="document-partition" />
                <KeysView tableData={tableData} extended={extended} type="document-sort" />
            </div>
            <div className={b()}>
                <Text as="p" color="secondary" className={b('description')}>
                    {i18n('context_document-attributes')}
                </Text>
                <ResizeableDataTable
                    columnsWidthLSKey={SCHEMA_COLUMNS_WIDTH_LS_KEY}
                    data={tableData}
                    columns={columns}
                    settings={DEFAULT_TABLE_SETTINGS}
                />
            </div>
        </React.Fragment>
    );
}
