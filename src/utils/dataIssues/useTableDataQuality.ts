import React from 'react';

import {isCleanDataQuality, isSameDataQuality, mergeDataQuality} from './dataQuality';
import type {ResponseDataQuality, TableDataWithQuality} from './types';

const DEFAULT_SOURCE = '';

/** Reports of the chunks that were loaded with something to tell, by table and chunk offset */
type ChunkReports = Record<string, Record<number, ResponseDataQuality>>;

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
 * `source` separates several tables that share the warning, e.g. expanded table groups.
 */
export function useTableDataQuality() {
    const [reports, setReports] = React.useState(NO_REPORTS);

    const handleChunkDataChange = React.useCallback(
        (
            chunkOffset: number,
            data: TableDataWithQuality<unknown> | undefined,
            source: string = DEFAULT_SOURCE,
        ) => {
            const quality = data?.dataQuality;
            // Only the chunks that have something to tell are kept
            const reported = quality && !isCleanDataQuality(quality) ? quality : undefined;

            setReports((prevReports) =>
                updateChunkReports(prevReports, source, chunkOffset, reported),
            );
        },
        [],
    );

    const dataQualityBySource = React.useMemo(() => {
        const result: Record<string, ResponseDataQuality> = {};

        for (const [source, chunks] of Object.entries(reports)) {
            const quality = mergeDataQuality(Object.values(chunks));
            if (quality) {
                result[source] = quality;
            }
        }

        return result;
    }, [reports]);

    return {
        /** Report of the table that does not name its source */
        dataQuality: dataQualityBySource[DEFAULT_SOURCE] as ResponseDataQuality | undefined,
        dataQualityBySource,
        handleChunkDataChange,
    };
}
