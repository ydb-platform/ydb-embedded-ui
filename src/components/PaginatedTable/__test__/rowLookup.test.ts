import {QueryStatus} from '@reduxjs/toolkit/query';

import type {ChunkLookupState} from '../rowLookup';
import {getChunkLookupRevision, isChunkLookupPending} from '../rowLookup';

const fulfilled = (offset: number, fulfilledTimeStamp: number): ChunkLookupState => ({
    offset,
    status: QueryStatus.fulfilled,
    fulfilledTimeStamp,
});

test('initial completion establishes the tail baseline without advancing the head', () => {
    const initial = getChunkLookupRevision([
        fulfilled(0, 10),
        {offset: 20, status: QueryStatus.pending},
    ]);
    const complete = [fulfilled(0, 10), fulfilled(20, 20)];
    const baseline = getChunkLookupRevision(complete, initial);
    expect(JSON.parse(baseline)).toEqual([
        [0, 10],
        [20, 20],
    ]);
    expect(isChunkLookupPending([fulfilled(0, 30), fulfilled(20, 20)], baseline)).toBe(true);
    expect(isChunkLookupPending([fulfilled(0, 30), fulfilled(20, 40)], baseline)).toBe(false);
});

test.each(['[[0,10],[20,null]]', '[[0,10]]'])('first success is not a refresh: %s', (revision) => {
    const states = [fulfilled(0, 30), fulfilled(20, 20)];
    expect(isChunkLookupPending(states, revision)).toBe(true);
    const initialized = getChunkLookupRevision(states, revision);
    expect(JSON.parse(initialized)).toEqual([
        [0, 10],
        [20, 20],
    ]);
    expect(isChunkLookupPending(states, initialized)).toBe(true);
});

test.each([QueryStatus.pending, QueryStatus.rejected, QueryStatus.uninitialized])(
    '%s cannot initialize or advance a chunk even with a retained timestamp',
    (status) => {
        const states = [fulfilled(0, 30), {offset: 20, status, fulfilledTimeStamp: 40}];
        for (const revision of ['[[0,10],[20,null]]', '[[0,10],[20,20]]']) {
            expect(getChunkLookupRevision(states, revision)).toBe(revision);
            expect(isChunkLookupPending(states, revision)).toBe(true);
        }
    },
);

test('zero is a known timestamp and equal or absent timestamps do not advance it', () => {
    const revision = getChunkLookupRevision([fulfilled(0, 0)]);
    expect(isChunkLookupPending([fulfilled(0, 0)], revision)).toBe(true);
    expect(isChunkLookupPending([{offset: 0, status: QueryStatus.fulfilled}], revision)).toBe(true);
    expect(isChunkLookupPending([fulfilled(0, 1)], revision)).toBe(false);
    expect(getChunkLookupRevision([fulfilled(0, 1)], revision)).toBe('[[0,1]]');
});

test('empty active chunks preserve the revision and do not confirm deletion', () => {
    const revision = '[[0,10],[20,20]]';
    expect(isChunkLookupPending([], revision)).toBe(true);
    expect(getChunkLookupRevision([], revision)).toBe(revision);
});

test('a completed refresh uses active offsets and reintroduced offsets initialize again', () => {
    const revision = '[[0,10],[20,20]]';
    const reduced = getChunkLookupRevision([fulfilled(0, 30)], revision);
    expect(reduced).toBe('[[0,30]]');
    const returned = [fulfilled(20, 40), fulfilled(0, 50)];
    expect(isChunkLookupPending(returned, reduced)).toBe(true);
    const initialized = getChunkLookupRevision(returned, reduced);
    expect(JSON.parse(initialized)).toEqual([
        [0, 30],
        [20, 40],
    ]);
    const refreshed = [fulfilled(20, 60), fulfilled(0, 50)];
    expect(isChunkLookupPending(refreshed, initialized)).toBe(false);
    expect(getChunkLookupRevision(refreshed, initialized)).toBe('[[0,50],[20,60]]');
});

test('initializing offsets preserves known revisions and does not mutate input states', () => {
    const states = Object.freeze([
        Object.freeze(fulfilled(20, 0)),
        Object.freeze(fulfilled(0, 30)),
    ]);
    const before = JSON.stringify(states);
    const result = getChunkLookupRevision([...states], '[[0,10],[20,null]]');
    expect(JSON.parse(result)).toEqual([
        [0, 10],
        [20, 0],
    ]);
    expect(JSON.stringify(states)).toBe(before);
    expect(getChunkLookupRevision([...states], result)).toBe(result);
});

test('keeps revision size bounded while moving across 50 active windows', () => {
    let revision: string | undefined;
    for (let window = 0; window < 50; window++) {
        revision = getChunkLookupRevision([fulfilled(window * 20, 100 + window)], revision);
        expect(JSON.parse(revision)).toEqual([[window * 20, 100 + window]]);
    }
});

test('drops inactive offsets without advancing the baseline of overlapping chunks', () => {
    const revision = '[[0,10],[20,20]]';
    const active = [fulfilled(20, 30), fulfilled(40, 40)];
    const moved = getChunkLookupRevision(active, revision);
    expect(JSON.parse(moved)).toEqual([
        [20, 20],
        [40, 40],
    ]);
    expect(isChunkLookupPending(active, moved)).toBe(true);
    expect(isChunkLookupPending([fulfilled(20, 30), fulfilled(40, 50)], moved)).toBe(false);
});

test('shrinks an incomplete revision and reinitializes an offset when it returns', () => {
    const reduced = getChunkLookupRevision([fulfilled(20, 20)], '[[0,10],[20,20]]');
    expect(reduced).toBe('[[20,20]]');
    expect(getChunkLookupRevision([], reduced)).toBe(reduced);
    expect(isChunkLookupPending([], reduced)).toBe(true);
    const returned = [fulfilled(0, 50), fulfilled(20, 30)];
    expect(isChunkLookupPending(returned, reduced)).toBe(true);
    const initialized = getChunkLookupRevision(returned, reduced);
    expect(JSON.parse(initialized)).toEqual([
        [0, 50],
        [20, 20],
    ]);
    expect(isChunkLookupPending(returned, initialized)).toBe(true);
    expect(isChunkLookupPending([fulfilled(0, 60), fulfilled(20, 30)], initialized)).toBe(false);
});

test('removes inactive offsets even when the new active chunk has not succeeded', () => {
    const states = [{offset: 20, status: QueryStatus.pending}];
    const revision = getChunkLookupRevision(states, '[[0,10]]');
    expect(revision).toBe('[]');
    expect(isChunkLookupPending(states, revision)).toBe(true);
    expect(getChunkLookupRevision([fulfilled(20, 30)], revision)).toBe('[[20,30]]');
});
