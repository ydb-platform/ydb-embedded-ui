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

    const previousFulfilledTimeStamp = previous.get(offset);
    return (
        previousFulfilledTimeStamp !== null &&
        previousFulfilledTimeStamp !== undefined &&
        fulfilledTimeStamp > previousFulfilledTimeStamp
    );
}

export function getChunkLookupRevision(states: ChunkLookupState[], revision?: string) {
    if (!revision) {
        return serializeChunkLookupRevision(states);
    }
    if (states.length === 0) {
        return revision;
    }

    const previous = parseChunkLookupRevision(revision);
    if (states.every((state) => hasChunkAdvanced(state, previous))) {
        return serializeChunkLookupRevision(states);
    }

    let changed = false;
    const activeOffsets = new Set(states.map(({offset}) => offset));
    for (const offset of previous.keys()) {
        if (!activeOffsets.has(offset)) {
            previous.delete(offset);
            changed = true;
        }
    }
    for (const {offset, status, fulfilledTimeStamp} of states) {
        const previousFulfilledTimeStamp = previous.get(offset);
        if (
            (previousFulfilledTimeStamp === null || previousFulfilledTimeStamp === undefined) &&
            status === QueryStatus.fulfilled &&
            fulfilledTimeStamp !== undefined
        ) {
            // Initial loading establishes a baseline, not a completed polling cycle.
            previous.set(offset, fulfilledTimeStamp);
            changed = true;
        }
    }
    return changed
        ? JSON.stringify(
              Array.from(previous).sort(([leftOffset], [rightOffset]) => leftOffset - rightOffset),
          )
        : revision;
}

export function isChunkLookupPending(states: ChunkLookupState[], revision?: string) {
    const previous = parseChunkLookupRevision(revision);

    return states.length === 0 || states.some((state) => !hasChunkAdvanced(state, previous));
}
