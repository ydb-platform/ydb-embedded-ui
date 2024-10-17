import React from 'react';

import {AccessDenied} from '../../components/Errors/403';
import {isAccessError} from '../../components/Errors/PageError/PageError';
import {ResponseError} from '../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {operationListApi} from '../../store/reducers/operationList';
import {useAutoRefreshInterval} from '../../utils/hooks';

import {OperationsControls} from './OperationsControls';
import {getColumns} from './columns';
import i18n from './i18n';
import {b} from './shared';
import {useOperationsQueryParams} from './useOperationsQueryParams';

interface OperationsProps {
    database: string;
}

export function Operations({database}: OperationsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {kind, searchValue, pageSize, pageToken, handleKindChange, handleSearchChange} =
        useOperationsQueryParams();

    const {data, isFetching, error} = operationListApi.useGetOperationListQuery(
        {database, kind, page_size: pageSize, page_token: pageToken},
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const filteredOperations = React.useMemo(() => {
        if (!data?.operations) {
            return [];
        }
        return data.operations.filter((op) =>
            op.id?.toLowerCase().includes(searchValue.toLowerCase()),
        );
    }, [data?.operations, searchValue]);

    if (isAccessError(error)) {
        return <AccessDenied position="left" />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>
                <OperationsControls
                    kind={kind}
                    searchValue={searchValue}
                    entitiesCountCurrent={filteredOperations.length}
                    entitiesCountTotal={data?.operations?.length}
                    entitiesLoading={isFetching}
                    handleKindChange={handleKindChange}
                    handleSearchChange={handleSearchChange}
                />
            </TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table loading={isFetching} className={b('table')}>
                {data ? (
                    <ResizeableDataTable
                        columns={getColumns()}
                        data={filteredOperations}
                        emptyDataMessage={i18n('operations.noData')}
                    />
                ) : null}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
