import React from 'react';

import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {isAccessError} from '../../utils/response';

import {OperationsControls} from './OperationsControls';
import {getColumns} from './columns';
import {OPERATIONS_SELECTED_COLUMNS_KEY} from './constants';
import i18n from './i18n';
import {b} from './shared';
import {useInfiniteOperations} from './useInfiniteOperations';
import {useOperationsQueryParams} from './useOperationsQueryParams';

interface OperationsProps {
    database: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

export function Operations({database, scrollContainerRef}: OperationsProps) {
    const {kind, searchValue, pageSize, handleKindChange, handleSearchChange} =
        useOperationsQueryParams();

    const {operations, isLoading, isLoadingMore, error, refreshTable, totalCount} =
        useInfiniteOperations({
            database,
            kind,
            pageSize,
            searchValue,
            scrollContainerRef,
        });

    if (isAccessError(error)) {
        return <AccessDenied position="left" />;
    }

    const settings = React.useMemo(() => {
        return {
            ...DEFAULT_TABLE_SETTINGS,
            sortable: false,
        };
    }, []);

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
            <TableWithControlsLayout.Table loading={isLoading} className={b('table')}>
                {operations.length > 0 || isLoading ? (
                    <ResizeableDataTable
                        columns={getColumns({database, refreshTable, kind})}
                        columnsWidthLSKey={OPERATIONS_SELECTED_COLUMNS_KEY}
                        data={operations}
                        settings={settings}
                        emptyDataMessage={i18n('title_empty')}
                    />
                ) : (
                    <div>{i18n('title_empty')}</div>
                )}
                {isLoadingMore && (
                    <TableSkeleton
                        showHeader={false}
                        rows={3}
                        delay={0}
                        className={b('loading-more')}
                    />
                )}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
