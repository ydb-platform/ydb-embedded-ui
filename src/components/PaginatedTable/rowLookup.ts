import {QueryStatus} from '@reduxjs/toolkit/query';

export interface ChunkLookupState {
    offset: number;
    status: QueryStatus;
    fulfilledTimeStamp?: number;
}

type ChunkLookupRevision = Array<[offset: number, fulfilledTimeStamp: number | null]>;

export function getChunkLookupRevision(states: ChunkLookupState[]) {
    return JSON.stringify(
        states.map(
            ({offset, fulfilledTimeStamp}) =>
                [offset, fulfilledTimeStamp ?? null] satisfies ChunkLookupRevision[number],
        ),
    );
}

export function isChunkLookupPending(states: ChunkLookupState[], revision?: string) {
    const previous = new Map<number, number | null>(
        revision ? (JSON.parse(revision) as ChunkLookupRevision) : [],
    );

    return states.some(({offset, status, fulfilledTimeStamp}) => {
        if (status !== QueryStatus.fulfilled) {
            return true;
        }

        const previousFulfilledTimeStamp = previous.get(offset);
        return (
            previousFulfilledTimeStamp !== undefined &&
            previousFulfilledTimeStamp !== null &&
            (fulfilledTimeStamp === undefined || fulfilledTimeStamp <= previousFulfilledTimeStamp)
        );
    });
}
