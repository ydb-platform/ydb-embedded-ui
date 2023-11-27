import {useEffect, useRef, memo} from 'react';

import {getArray} from '../../utils';

import type {Column, Chunk, GetRowClassName} from './types';
import {LoadingTableRow, TableRow} from './TableRow';

// With original memo generic types are lost
const typedMemo: <T>(Component: T) => T = memo;

interface TableChunkProps<T> {
    id: number;
    chunkSize: number;
    rowHeight: number;
    columns: Column<T>[];
    chunkData: Chunk<T> | undefined;
    observer: IntersectionObserver;
    getRowClassName?: GetRowClassName<T>;
}

// Memoisation prevents chunks rerenders that could cause perfomance issues on big tables
export const TableChunk = typedMemo(function TableChunk<T>({
    id,
    chunkSize,
    rowHeight,
    columns,
    chunkData,
    observer,
    getRowClassName,
}: TableChunkProps<T>) {
    const ref = useRef<HTMLTableSectionElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (el) {
            observer.observe(el);
        }
        return () => {
            if (el) {
                observer.unobserve(el);
            }
        };
    }, [observer]);

    const dataLength = chunkData?.data?.length;
    const chunkHeight = dataLength ? dataLength * rowHeight : chunkSize * rowHeight;

    const getLoadingRows = () => {
        return getArray(chunkSize).map((value) => {
            return (
                <LoadingTableRow key={value} columns={columns} height={rowHeight} index={value} />
            );
        });
    };

    const renderContent = () => {
        if (!chunkData || !chunkData.active) {
            return null;
        }

        // Display skeletons in case of error
        if (chunkData.loading || chunkData.error) {
            return getLoadingRows();
        }

        return chunkData.data?.map((data, index) => {
            return (
                <TableRow
                    key={index}
                    index={index}
                    row={data}
                    columns={columns}
                    height={rowHeight}
                    getRowClassName={getRowClassName}
                />
            );
        });
    };

    return (
        <tbody ref={ref} id={id.toString()} style={{height: `${chunkHeight}px`}}>
            {renderContent()}
        </tbody>
    );
});
