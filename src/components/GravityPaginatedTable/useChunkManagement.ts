import React from 'react';

export function useChunkManagement(startIndex: number, endIndex: number, chunkSize: number) {
    return React.useMemo(() => {
        const startChunk = Math.floor(startIndex / chunkSize);
        const endChunk = Math.floor(endIndex / chunkSize);
        const chunks = [];
        for (let i = startChunk; i <= endChunk; i++) {
            chunks.push(i);
        }
        return chunks;
    }, [startIndex, endIndex, chunkSize]);
}
