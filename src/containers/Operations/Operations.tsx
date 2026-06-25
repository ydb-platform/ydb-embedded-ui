import React from 'react';

import {Unauthenticated} from '../../components/Errors/401';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {useAnalyzeOperationAvailable} from '../../store/reducers/capabilities/hooks';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {isForbiddenError, isRedirectToAuth, isUnauthenticatedError} from '../../utils/response';

import {OperationsControls} from './OperationsControls';
import {getColumns} from './columns';
import {
    ANALYZE_OPERATION_KIND,
    OPERATIONS_SELECTED_COLUMNS_KEY,
    OPERATION_KINDS,
} from './constants';
import i18n from './i18n';
import {b} from './shared';
import {useOperationsInfiniteQuery} from './useOperationsInfiniteQuery';
import {useOperationsQueryParams} from './useOperationsQueryParams';

interface OperationsProps {
    database: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

export function Operations({database, scrollContainerRef}: OperationsProps) {
    const {
        kind: queryKind,
        searchValue,
        pageSize,
        handleKindChange,
        handleSearchChange,
    } = useOperationsQueryParams();
    const analyzeOperationAvailable = useAnalyzeOperationAvailable();

    const operationKinds = React.useMemo(() => {
        return analyzeOperationAvailable
            ? [...OPERATION_KINDS, ANALYZE_OPERATION_KIND]
            : OPERATION_KINDS;
    }, [analyzeOperationAvailable]);

    const kind = queryKind === 'analyze' && !analyzeOperationAvailable ? 'buildindex' : queryKind;

    const {operations, isLoading, isLoadingMore, error} = useOperationsInfiniteQuery({
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

    if (isRedirectToAuth(error)) {
        return null;
    }

    if (isUnauthenticatedError(error)) {
        return <Unauthenticated />;
    }

    if (isForbiddenError(error)) {
        return <AccessDenied />;
    }

    const hasNoData = operations.length === 0;

    return (
        <React.Fragment>
            {error ? <ResponseError error={error} /> : null}
            {error && hasNoData && !isLoading ? null : (
                <TableWithControlsLayout>
                    <TableWithControlsLayout.Controls>
                        <OperationsControls
                            kind={kind}
                            operationKinds={operationKinds}
                            searchValue={searchValue}
                            handleKindChange={handleKindChange}
                            handleSearchChange={handleSearchChange}
                        />
                    </TableWithControlsLayout.Controls>
                    <TableWithControlsLayout.Table loading={isLoading} className={b('table')}>
                        {!hasNoData || isLoading ? (
                            <ResizeableDataTable
                                columns={getColumns({database, kind})}
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
            )}
        </React.Fragment>
    );
}
