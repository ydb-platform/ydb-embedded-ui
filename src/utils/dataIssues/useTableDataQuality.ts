import React from 'react';

import {isCleanDataQuality, isSameDataQuality, mergeDataQuality} from './dataQuality';
import type {ResponseDataQuality, TableDataWithQuality} from './types';

const DEFAULT_SOURCE = '';

/** Reports of the chunks that were loaded with something to tell, by table and chunk offset */
type ChunkReports = Record<string, Record<number, ResponseDataQuality>>;

export type ChunkDataChangeHandler = (
    chunkOffset: number,
    data: TableDataWithQuality<unknown> | undefined,
) => void;

const NO_REPORTS: ChunkReports = {};

function updateChunkReports(
    reports: ChunkReports,
    source: string,
    chunkOffset: number,
    quality: ResponseDataQuality | undefined,
): ChunkReports {
    const chunks = reports[source];
    const current = chunks?.[chunkOffset];

    if (!quality) {
        if (!current) {
            return reports;
        }

        const {[chunkOffset]: _removedChunk, ...otherChunks} = chunks;
        if (Object.keys(otherChunks).length > 0) {
            return {...reports, [source]: otherChunks};
        }

        const {[source]: _removedSource, ...otherSources} = reports;
        return otherSources;
    }

    if (current && isSameDataQuality(current, quality)) {
        return reports;
    }

    return {...reports, [source]: {...chunks, [chunkOffset]: quality}};
}

/**
 * Collects what the handler reported about the rows a paginated table currently renders.
 *
 * A table is loaded in chunks, every chunk by a request of its own, and a problem
 * of one request says nothing about the others. So the reports are kept per chunk
 * (see `onChunkDataChange` of `PaginatedTable`) and united:
 * - a chunk loaded with problems keeps the warning until it is reloaded without them
 *   or is no longer rendered, whatever the other chunks report and in whatever order;
 * - a chunk has no data for new filters or sorting until it is loaded for them,
 *   so a warning does not outlive the request it was received for.
 *
 * Several tables can share the warning, e.g. the tables of expanded groups:
 * each of them reports through its own handler from `getChunkDataChangeHandler(source)`.
 */
export function useTableDataQuality() {
    // The chunks report on every mount, unmount and reload, mostly that they have nothing to tell.
    // The reports live in a ref and get into the state only when they change, so a table
    // without problems does not make its owner render while it is scrolled.
    const reportsRef = React.useRef(NO_REPORTS);
    const [reports, setReports] = React.useState(NO_REPORTS);
    const handlersRef = React.useRef(new Map<string, ChunkDataChangeHandler>());

    const getChunkDataChangeHandler = React.useCallback((source: string) => {
        let handler = handlersRef.current.get(source);

        if (!handler) {
            handler = (chunkOffset, data) => {
                const quality = data?.dataQuality;
                // Only the chunks that have something to tell are kept
                const reported = quality && !isCleanDataQuality(quality) ? quality : undefined;
                const nextReports = updateChunkReports(
                    reportsRef.current,
                    source,
                    chunkOffset,
                    reported,
                );

                if (nextReports !== reportsRef.current) {
                    reportsRef.current = nextReports;
                    setReports(nextReports);
                }
            };
            handlersRef.current.set(source, handler);
        }

        return handler;
    }, []);

    const dataQuality = React.useMemo(
        () => mergeDataQuality(Object.values(reports).flatMap((chunks) => Object.values(chunks))),
        [reports],
    );

    return {
        /** United report of all the chunks that are rendered now */
        dataQuality,
        /** For a single table */
        handleChunkDataChange: getChunkDataChangeHandler(DEFAULT_SOURCE),
        /** For one of several tables; the handler of a source is always the same function */
        getChunkDataChangeHandler,
    };
}
