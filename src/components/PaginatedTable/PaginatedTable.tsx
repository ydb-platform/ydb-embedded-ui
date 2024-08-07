import React from 'react';

import type {IResponseError} from '../../types/api/error';
import {getArray} from '../../utils';
import {ResponseError} from '../Errors/ResponseError';
import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';

import {TableChunk} from './TableChunk';
import {TableHead} from './TableHead';
import {EmptyTableRow} from './TableRow';
import {DEFAULT_REQUEST_TIMEOUT, DEFAULT_TABLE_ROW_HEIGHT} from './constants';
import i18n from './i18n';
import {
    createPaginatedTableReducer,
    initChunk,
    removeChunk,
    resetChunks,
    setChunkData,
    setChunkError,
    setChunkLoading,
} from './reducer';
import {b} from './shared';
import type {
    Column,
    FetchData,
    GetRowClassName,
    HandleTableColumnsResize,
    OnEntry,
    OnLeave,
    OnSort,
    RenderControls,
    RenderEmptyDataMessage,
    RenderErrorMessage,
    SortParams,
} from './types';
import {useIntersectionObserver} from './useIntersectionObserver';

import './PaginatedTable.scss';

export interface PaginatedTableProps<T> {
    limit: number;
    fetchData: FetchData<T>;
    columns: Column<T>[];
    getRowClassName?: GetRowClassName<T>;
    rowHeight?: number;
    parentContainer?: Element | null;
    initialSortParams?: SortParams;
    onColumnsResize?: HandleTableColumnsResize;

    renderControls?: RenderControls;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;

    dependencyArray?: unknown[]; // Fully reload table on params change
}

export const PaginatedTable = <T,>({
    limit,
    fetchData,
    columns,
    getRowClassName,
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
    parentContainer,
    initialSortParams,
    onColumnsResize,
    renderControls,
    renderEmptyDataMessage,
    renderErrorMessage,
    dependencyArray,
}: PaginatedTableProps<T>) => {
    const inited = React.useRef(false);
    const tableContainer = React.useRef<HTMLDivElement>(null);

    const [state, dispatch] = React.useReducer(createPaginatedTableReducer<T>(), {});

    const [sortParams, setSortParams] = React.useState<SortParams | undefined>(initialSortParams);

    const [totalEntities, setTotalEntities] = React.useState(limit);
    const [foundEntities, setFoundEntities] = React.useState(0);

    const [error, setError] = React.useState<IResponseError>();

    const pendingRequests = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const fetchChunkData = React.useCallback(
        async (id: string) => {
            dispatch(setChunkLoading(id));

            const timer = setTimeout(async () => {
                const offset = Number(id) * limit;

                try {
                    const response = await fetchData(limit, offset, sortParams);
                    const {data, total, found} = response;

                    setTotalEntities(total);
                    setFoundEntities(found);
                    inited.current = true;

                    dispatch(setChunkData(id, data));
                } catch (err) {
                    // Do not set error on cancelled requests
                    if ((err as IResponseError)?.isCancelled) {
                        return;
                    }

                    dispatch(setChunkError(id, err as IResponseError));
                    setError(err as IResponseError);
                }
            }, DEFAULT_REQUEST_TIMEOUT);

            // Chunk data load could be triggered by different events
            // Cancel previous chunk request, while it is pending (instead of concurrentId)
            if (pendingRequests.current[id]) {
                const oldTimer = pendingRequests.current[id];
                window.clearTimeout(oldTimer);
            }
            pendingRequests.current[id] = timer;
        },
        [fetchData, limit, sortParams],
    );

    const onEntry = React.useCallback<OnEntry>((id) => {
        dispatch(initChunk(id));
    }, []);

    const onLeave = React.useCallback<OnLeave>((id) => {
        dispatch(removeChunk(id));

        // If there is a pending request for the removed chunk, cancel it
        // It made to prevent excessive requests on fast scroll
        if (pendingRequests.current[id]) {
            const timer = pendingRequests.current[id];
            window.clearTimeout(timer);
            delete pendingRequests.current[id];
        }
    }, []);

    // Cancel all pending requests on component unmount
    React.useEffect(() => {
        return () => {
            Object.values(pendingRequests.current).forEach((timer) => {
                window.clearTimeout(timer);
            });
            pendingRequests.current = {};
        };
    }, []);

    // Load chunks if they become active
    // This mecanism helps to set chunk active state from different sources, but load data only once
    // Only currently active chunks should be in state so iteration by the whole state shouldn't be a problem
    React.useEffect(() => {
        for (const id of Object.keys(state)) {
            const chunk = state[Number(id)];

            if (chunk?.active && !chunk?.loading && !chunk?.wasLoaded) {
                fetchChunkData(id);
            }
        }
    }, [fetchChunkData, state]);

    // Reset table on filters change
    React.useEffect(() => {
        // Reset counts, so table unmount unneeded chunks
        setTotalEntities(limit);
        setFoundEntities(0);
        setError(undefined);

        // Remove all chunks from state
        dispatch(resetChunks());

        // Reset table state for the controls
        inited.current = false;

        // If there is a parent, scroll to parent container ref
        // Else scroll to table top
        // It helps to prevent layout shifts, when chunks quantity is changed
        if (parentContainer) {
            parentContainer.scrollTo(0, 0);
        } else {
            tableContainer.current?.scrollTo(0, 0);
        }

        // Make table start to load data
        dispatch(initChunk('0'));
    }, [dependencyArray, limit, parentContainer]);

    // Reload currently active chunks
    // Use case - sort params change, so data should be updated, but without chunks unmount
    const reloadCurrentViewport = () => {
        for (const id of Object.keys(state)) {
            if (state[Number(id)]?.active) {
                dispatch(initChunk(id));
            }
        }
    };

    const handleSort: OnSort = (params) => {
        setSortParams(params);
        reloadCurrentViewport();
    };

    const observer = useIntersectionObserver({onEntry, onLeave, parentContainer});

    // Render at least 1 chunk
    const totalLength = foundEntities || limit;
    const chunksCount = Math.ceil(totalLength / limit);

    const renderChunks = () => {
        if (!observer) {
            return null;
        }

        return getArray(chunksCount).map((value) => {
            const chunkData = state[value];

            return (
                <TableChunk
                    observer={observer}
                    key={value}
                    id={value}
                    chunkSize={limit}
                    rowHeight={rowHeight}
                    columns={columns}
                    chunkData={chunkData}
                    getRowClassName={getRowClassName}
                />
            );
        });
    };

    const renderData = () => {
        if (inited.current && foundEntities === 0) {
            return (
                <tbody>
                    <EmptyTableRow columns={columns}>
                        {renderEmptyDataMessage ? renderEmptyDataMessage() : i18n('empty')}
                    </EmptyTableRow>
                </tbody>
            );
        }

        // If first chunk is loaded with the error, display error
        // In case of other chunks table will be inited
        if (!inited.current && error) {
            return (
                <tbody>
                    <EmptyTableRow columns={columns}>
                        {renderErrorMessage ? (
                            renderErrorMessage(error)
                        ) : (
                            <ResponseError error={error} />
                        )}
                    </EmptyTableRow>
                </tbody>
            );
        }

        return renderChunks();
    };

    const renderTable = () => {
        return (
            <table className={b('table')}>
                <TableHead
                    columns={columns}
                    onSort={handleSort}
                    onColumnsResize={onColumnsResize}
                />
                {renderData()}
            </table>
        );
    };

    const renderContent = () => {
        if (renderControls) {
            return (
                <TableWithControlsLayout>
                    <TableWithControlsLayout.Controls>
                        {renderControls({inited: inited.current, totalEntities, foundEntities})}
                    </TableWithControlsLayout.Controls>
                    <TableWithControlsLayout.Table>{renderTable()}</TableWithControlsLayout.Table>
                </TableWithControlsLayout>
            );
        }

        return renderTable();
    };

    return (
        <div ref={tableContainer} className={b(null)}>
            {renderContent()}
        </div>
    );
};
