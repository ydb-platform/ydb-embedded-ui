import React from 'react';

import {PageError} from '../../components/Errors/PageError/PageError';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';

import {OperationsControls} from './OperationsControls';
import {getColumns} from './columns';
import {OPERATIONS_SELECTED_COLUMNS_KEY} from './constants';
import i18n from './i18n';
import {b} from './shared';
import {useOperationsInfiniteQuery} from './useOperationsInfiniteQuery';
import {useOperationsQueryParams} from './useOperationsQueryParams';

interface OperationsProps {
    database: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

export function Operations({database, scrollContainerRef}: OperationsProps) {
    const {kind, searchValue, pageSize, handleKindChange, handleSearchChange} =
        useOperationsQueryParams();

    const {operations, isLoading, isLoadingMore, error, refreshTable} = useOperationsInfiniteQuery({
        database,
        kind,
        pageSize,
        searchValue,
        scrollContainerRef,
    });

    const settings = React.useMemo(() => {
        return {
            ...DEFAULT_TABLE_SETTINGS,
            sortable: false,
        };
    }, []);

    if (error) {
        return <PageError error={error} position="left" />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>
                <OperationsControls
                    kind={kind}
                    searchValue={searchValue}
                    handleKindChange={handleKindChange}
                    handleSearchChange={handleSearchChange}
                />
            </TableWithControlsLayout.Controls>
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
