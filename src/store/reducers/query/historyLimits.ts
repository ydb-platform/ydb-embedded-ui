import {sortByTimestampDescending} from '../../../utils/sortByTimestamp';
import {MAX_USER_SETTING_BYTES, serializeUserSettingBody} from '../../../utils/userSettingBody';

import type {RawQueryInHistory} from './types';

const MAX_QUERIES_IN_HISTORY = 20;
// The settings API sends a JSON string containing the JSON array.
const EMPTY_HISTORY_BYTES = 4; // '"[]"'
const MAX_HISTORY_ENTRY_BYTES = Math.floor(
    (MAX_USER_SETTING_BYTES - EMPTY_HISTORY_BYTES - (MAX_QUERIES_IN_HISTORY - 1)) /
        MAX_QUERIES_IN_HISTORY,
);

function getEntryBytes(entry: unknown, encoder: TextEncoder) {
    const serialized = JSON.stringify(entry) ?? 'null';
    // The outer quotes are shared by the whole request body.
    return encoder.encode(serializeUserSettingBody(serialized)).byteLength - 2;
}

function getEntryStartTime(entry: unknown): number | undefined {
    if (entry && typeof entry === 'object' && 'startTime' in entry) {
        const {startTime} = entry;
        if (typeof startTime === 'number' && Number.isFinite(startTime)) {
            return startTime;
        }
    }

    return undefined;
}

export function limitQueryHistory<T>(history: readonly T[]): T[] {
    const encoder = new TextEncoder();
    const newestEntries: T[] = [];
    let bytes = EMPTY_HISTORY_BYTES;

    const sorted = sortByTimestampDescending(history, getEntryStartTime);
    for (const entry of sorted.slice(0, MAX_QUERIES_IN_HISTORY)) {
        const entryBytes = getEntryBytes(entry, encoder);
        if (entryBytes + EMPTY_HISTORY_BYTES > MAX_USER_SETTING_BYTES) {
            continue;
        }

        const nextBytes = bytes + entryBytes + Number(newestEntries.length > 0);
        if (nextBytes > MAX_USER_SETTING_BYTES) {
            break;
        }

        newestEntries.push(entry);
        bytes = nextBytes;
    }

    return newestEntries.reverse();
}

export function appendQueryToHistory(
    history: readonly RawQueryInHistory[],
    query: RawQueryInHistory,
): RawQueryInHistory[] | undefined {
    if (
        query.queryText.length > MAX_HISTORY_ENTRY_BYTES ||
        getEntryBytes(query, new TextEncoder()) > MAX_HISTORY_ENTRY_BYTES
    ) {
        return undefined;
    }

    return limitQueryHistory([...history, query]);
}
