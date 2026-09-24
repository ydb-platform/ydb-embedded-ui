import {QueryStatus} from '@reduxjs/toolkit/query';

export interface ChunkLookupState {
    offset: number;
    status: QueryStatus;
    fulfilledTimeStamp?: number;
}

type ChunkLookupRevision = Array<[offset: number, fulfilledTimeStamp: number | null]>;

function serializeChunkLookupRevision(states: ChunkLookupState[]) {
    return JSON.stringify(
        states
            .map(
                ({offset, fulfilledTimeStamp}) =>
                    [offset, fulfilledTimeStamp ?? null] satisfies ChunkLookupRevision[number],
            )
            .sort(([leftOffset], [rightOffset]) => leftOffset - rightOffset),
    );
}

function parseChunkLookupRevision(revision?: string) {
    return new Map<number, number | null>(
        revision ? (JSON.parse(revision) as ChunkLookupRevision) : [],
    );
}

function hasChunkAdvanced(
    {offset, status, fulfilledTimeStamp}: ChunkLookupState,
    previous: Map<number, number | null>,
) {
    if (status !== QueryStatus.fulfilled || fulfilledTimeStamp === undefined) {
        return false;
    }

    if (!previous.has(offset)) {
        return true;
    }

    const previousFulfilledTimeStamp = previous.get(offset);
    return (
        previousFulfilledTimeStamp === null ||
        (previousFulfilledTimeStamp !== undefined &&
            fulfilledTimeStamp > previousFulfilledTimeStamp)
    );
}

export function getChunkLookupRevision(states: ChunkLookupState[], revision?: string) {
    if (!revision) {
        return serializeChunkLookupRevision(states);
    }

    const previous = parseChunkLookupRevision(revision);
    return states.length > 0 && states.every((state) => hasChunkAdvanced(state, previous))
        ? serializeChunkLookupRevision(states)
        : revision;
}

export function isChunkLookupPending(states: ChunkLookupState[], revision?: string) {
    const previous = parseChunkLookupRevision(revision);

    return states.some((state) => !hasChunkAdvanced(state, previous));
}
