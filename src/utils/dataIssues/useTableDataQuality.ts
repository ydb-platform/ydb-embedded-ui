import React from 'react';

import {isCleanDataQuality, isSameDataQuality, mergeDataQuality} from './dataQuality';
import type {ResponseDataQuality, TableDataWithQuality} from './types';

const DEFAULT_SOURCE = '';

/** Reports of the rendered chunks that were loaded with something to tell, by table and chunk offset */
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
 * - a chunk loaded with problems keeps the warning while its rows are rendered, until it is
 *   reloaded without them, whatever the other chunks report and in whatever order;
 * - a chunk has no data for new filters or sorting until it is loaded for them,
 *   so a warning does not outlive the request it was received for.
 *
 * Several tables can share the warning, e.g. the tables of expanded groups:
 * each of them reports through its own handler from `getChunkDataChangeHandler(source)`.
 */
export function useTableDataQuality() {
    // The chunks report on every scroll step: they enter and leave the render range and reload.
    // Their reports live in a ref, and the state gets only the united result, only when it
    // really changes. So neither a healthy table nor a table whose chunks all report the same
    // problem makes its owner render while it is scrolled.
    const reportsRef = React.useRef(NO_REPORTS);
    const publishedRef = React.useRef<ResponseDataQuality>();
    const [dataQuality, setDataQuality] = React.useState<ResponseDataQuality>();
    const handlersRef = React.useRef(new Map<string, ChunkDataChangeHandler>());

    const getChunkDataChangeHandler = React.useCallback((source: string) => {
        let handler = handlersRef.current.get(source);

        if (!handler) {
            handler = (chunkOffset, data) => {
                const quality = data?.meta?.dataQuality;
                // Only the chunks that have something to tell are kept
                const reported = quality && !isCleanDataQuality(quality) ? quality : undefined;
                const nextReports = updateChunkReports(
                    reportsRef.current,
                    source,
                    chunkOffset,
                    reported,
                );

                if (nextReports === reportsRef.current) {
                    return;
                }
                reportsRef.current = nextReports;

                const united = mergeDataQuality(
                    Object.values(nextReports).flatMap((chunks) => Object.values(chunks)),
                );
                // The codes are united in the order the chunks are stored, which follows their arrival
                if (!isSameDataQuality(united, publishedRef.current)) {
                    publishedRef.current = united;
                    setDataQuality(united);
                }
            };
            handlersRef.current.set(source, handler);
        }

        return handler;
    }, []);

    return {
        /** United report of all the chunks whose rows are rendered now */
        dataQuality,
        /** For a single table */
        handleChunkDataChange: getChunkDataChangeHandler(DEFAULT_SOURCE),
        /** For one of several tables; the handler of a source is always the same function */
        getChunkDataChangeHandler,
    };
}
