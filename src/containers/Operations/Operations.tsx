import React from 'react';

import {useTable} from '@gravity-ui/table';

import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Table} from '../../components/Table/Table';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {isAccessError} from '../../utils/response';

import {OperationsControls} from './OperationsControls';
import {getColumns} from './columns';
import i18n from './i18n';
import {b} from './shared';
import {useInfiniteOperations} from './useInfiniteOperations';
import {useOperationsQueryParams} from './useOperationsQueryParams';

interface OperationsProps {
    database: string;
}

export function Operations({database}: OperationsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {kind, searchValue, pageSize, handleKindChange, handleSearchChange} =
        useOperationsQueryParams();

    const {
        operations,
        isLoading,
        isLoadingMore,
        error,
        hasNextPage,
        loadNextPage,
        refreshTable,
        totalCount,
    } = useInfiniteOperations({
        database,
        kind,
        pageSize,
        searchValue,
        pollingInterval: autoRefreshInterval,
    });

    // Set up table with infinite scrolling
    const columns = React.useMemo(
        () => getColumns({database, refreshTable}),
        [database, refreshTable],
    );

    const table = useTable({
        data: operations,
        columns,
        enableSorting: true,
    });

    // Handle scroll for infinite loading
    const handleScroll = React.useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
            const target = event.target as HTMLElement;
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;

            // Load next page when scrolled near bottom
            if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isLoadingMore) {
                loadNextPage();
            }
        },
        [hasNextPage, isLoadingMore, loadNextPage],
    );

    if (isAccessError(error)) {
        return <AccessDenied position="left" />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>
                <OperationsControls
                    kind={kind}
                    searchValue={searchValue}
                    entitiesCountCurrent={operations.length}
                    entitiesCountTotal={totalCount}
                    entitiesLoading={isLoading}
                    handleKindChange={handleKindChange}
                    handleSearchChange={handleSearchChange}
                />
            </TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table
                loading={isLoading}
                className={b('table')}
                onScroll={handleScroll}
            >
                {operations.length > 0 || isLoading ? (
                    <Table table={table} />
                ) : (
                    <div>{i18n('title_empty')}</div>
                )}
                {isLoadingMore && (
                    <div style={{textAlign: 'center', padding: '16px'}}>Loading more...</div>
                )}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
