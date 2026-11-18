import React from 'react';

import type {SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import {SegmentedRadioGroup, Select} from '@gravity-ui/uikit';

import {Unauthenticated} from '../../components/Errors/401';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {isForbiddenError, isRedirectToAuth, isUnauthenticatedError} from '../../utils/response';

import {OperationsControls} from './OperationsControls';
import {getColumns} from './columns';
import {
    ANALYZE_OPERATION_KIND,
    OPERATIONS_SELECTED_COLUMNS_KEY,
    OPERATION_KINDS,
} from './constants';
import {CONTROL_PLANE_STATUS_TITLES, getControlPlaneColumns} from './controlPlaneColumns';
import i18n from './i18n';
import {b} from './shared';
import {useOperationsInfiniteQuery} from './useOperationsInfiniteQuery';
import {useOperationsQueryParams} from './useOperationsQueryParams';
import {useOperationsSource} from './useOperationsSource';
import {resolveOperationsRenderState} from './utils';

interface OperationsProps {
    controlPlaneOnly?: boolean;
    database: string;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}

export function Operations({
    database,
    scrollContainerRef,
    controlPlaneOnly = false,
}: OperationsProps) {
    const {source, setSource, cpAvailable, isControlPlane, controlPlaneParams, skipDatabase} =
        useOperationsSource(database, controlPlaneOnly);
    const {
        kind,
        analyzeOperationAvailable,
        searchValue,
        controlPlaneSearch,
        controlPlaneStatus,
        handleControlPlaneSearchChange,
        handleControlPlaneStatusChange,
        pageSize,
        handleKindChange,
        handleSearchChange,
    } = useOperationsQueryParams();

    const operationKinds = React.useMemo(() => {
        return analyzeOperationAvailable
            ? [...OPERATION_KINDS, ANALYZE_OPERATION_KIND]
            : OPERATION_KINDS;
    }, [analyzeOperationAvailable]);

    const {operations, totalLoaded, isLoading, isLoadingMore, error} = useOperationsInfiniteQuery({
        database,
        kind,
        pageSize,
        controlPlaneParams,
        skipDatabase,
        searchValue,
        controlPlaneSearch,
        controlPlaneStatus,
        scrollContainerRef,
    });

    const [controlPlaneSort, setControlPlaneSort] = React.useState<
        SortOrder | SortOrder[] | undefined
    >({columnId: 'created_at', order: DataTable.DESCENDING});

    const settings = React.useMemo(() => {
        return {
            ...DEFAULT_TABLE_SETTINGS,
            sortable: isControlPlane,
        };
    }, [isControlPlane]);

    if (isRedirectToAuth(error)) {
        return null;
    }

    const unauthenticated = isUnauthenticatedError(error);
    const forbidden = isForbiddenError(error);
    const accessError = unauthenticated || forbidden;

    const emptyMessage =
        isControlPlane && totalLoaded > 0
            ? i18n('title_no-matching-operations')
            : i18n('title_empty');
    const hasNoData = operations.length === 0;
    const {showEmpty, showErrorBelowTable, showFullError, showTable} = resolveOperationsRenderState(
        {
            hasData: !hasNoData,
            hasError: Boolean(error),
            isLoading,
        },
    );

    const renderTable = () => (
        <TableWithControlsLayout.Table loading={isLoading} className={b('table')}>
            {unauthenticated ? <Unauthenticated /> : null}
            {forbidden ? <AccessDenied /> : null}
            {showFullError && !accessError ? <ResponseError error={error} /> : null}
            {showTable && !accessError ? (
                <ResizeableDataTable
                    columns={
                        isControlPlane
                            ? getControlPlaneColumns(controlPlaneParams?.clusterName)
                            : getColumns({database, kind})
                    }
                    columnsWidthLSKey={
                        isControlPlane
                            ? 'selectedControlPlaneOperationColumns'
                            : OPERATIONS_SELECTED_COLUMNS_KEY
                    }
                    sortOrder={isControlPlane ? controlPlaneSort : []}
                    onSortChange={isControlPlane ? setControlPlaneSort : undefined}
                    data={operations}
                    settings={settings}
                    emptyDataMessage={emptyMessage}
                />
            ) : null}
            {showEmpty ? <div>{emptyMessage}</div> : null}
            {isLoadingMore && (
                <TableSkeleton
                    showHeader={false}
                    rows={3}
                    delay={0}
                    className={b('loading-more')}
                />
            )}
            {showErrorBelowTable && !accessError ? <ResponseError error={error} /> : null}
        </TableWithControlsLayout.Table>
    );

    return (
        <React.Fragment>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls>
                    {cpAvailable && (
                        <SegmentedRadioGroup
                            value={source}
                            onUpdate={(value) => setSource(value, 'replaceIn')}
                            aria-label={i18n('field_operation-source')}
                        >
                            <SegmentedRadioGroup.Option
                                value="database"
                                disabled={controlPlaneOnly}
                            >
                                {i18n('value_database')}
                            </SegmentedRadioGroup.Option>
                            <SegmentedRadioGroup.Option value="control-plane">
                                {i18n('value_control-plane')}
                            </SegmentedRadioGroup.Option>
                        </SegmentedRadioGroup>
                    )}
                    {isControlPlane && (
                        <React.Fragment>
                            <Search
                                value={controlPlaneSearch}
                                onChange={handleControlPlaneSearchChange}
                                placeholder={i18n('placeholder_filter-by-id')}
                                className={b('search')}
                            />
                            <Select
                                value={controlPlaneStatus ? [controlPlaneStatus] : []}
                                onUpdate={(value) => handleControlPlaneStatusChange(value[0] ?? '')}
                                hasClear
                                placeholder={i18n('column_status')}
                                aria-label={i18n('field_filter-status')}
                                options={Object.entries(CONTROL_PLANE_STATUS_TITLES).map(
                                    ([value, content]) => ({value, content}),
                                )}
                                width={150}
                            />
                        </React.Fragment>
                    )}
                    {!isControlPlane && (
                        <OperationsControls
                            kind={kind}
                            operationKinds={operationKinds}
                            searchValue={searchValue}
                            handleKindChange={handleKindChange}
                            handleSearchChange={handleSearchChange}
                        />
                    )}
                </TableWithControlsLayout.Controls>
                {renderTable()}
            </TableWithControlsLayout>
        </React.Fragment>
    );
}
