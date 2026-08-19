import type {SavedQuery} from '../../../../types/store/query';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatDateTime} from '../../../../utils/dataFormatters/dataFormatters';

const normalizeSavedQueryName = (value: string) => value.trim().toLowerCase();

function findSavedQueryIndex(queries: SavedQuery[], name: string): number {
    const exactIndex = queries.findIndex((query) => query.name === name);
    if (exactIndex >= 0) {
        return exactIndex;
    }

    const normalizedName = normalizeSavedQueryName(name);

    return queries.findIndex((query) => normalizeSavedQueryName(query.name) === normalizedName);
}

export function hasSavedQueryName(queries: SavedQuery[], name: string): boolean {
    return findSavedQueryIndex(queries, name) >= 0;
}

export function hasSavedQueryNameCollision(
    queries: SavedQuery[],
    currentName: string,
    candidateName: string,
): boolean {
    if (candidateName === currentName) {
        return false;
    }

    const currentIndex = findSavedQueryIndex(queries, currentName);
    const normalizedCandidateName = normalizeSavedQueryName(candidateName);

    return queries.some(
        ({name}, index) =>
            index !== currentIndex && normalizeSavedQueryName(name) === normalizedCandidateName,
    );
}

export function filterSavedQueries(queries: SavedQuery[], filter: string): SavedQuery[] {
    const normalizedFilter = normalizeSavedQueryName(filter);
    if (!normalizedFilter) {
        return queries;
    }
    return queries.filter(
        ({name, body}) =>
            name.toLowerCase().includes(normalizedFilter) ||
            body.toLowerCase().includes(normalizedFilter),
    );
}

export function upsertSavedQuery(
    queries: SavedQuery[],
    name: string,
    body: string,
    updatedAt: number,
): SavedQuery[] {
    const index = findSavedQueryIndex(queries, name);
    if (index < 0) {
        return [...queries, {name, body, updatedAt}];
    }
    const nextQueries = [...queries];
    nextQueries[index] = {...queries[index], body, updatedAt};
    return nextQueries;
}

export function renameSavedQueryInList(
    queries: SavedQuery[],
    previousName: string,
    nextName: string,
    updatedAt: number,
): {queries: SavedQuery[]; renamed: boolean} {
    const index = findSavedQueryIndex(queries, previousName);
    if (index < 0) {
        return {queries, renamed: false};
    }
    const nextQueries = [...queries];
    nextQueries[index] = {...queries[index], name: nextName, updatedAt};
    return {queries: nextQueries, renamed: true};
}

export function formatSavedQueryUpdatedAt(updatedAt?: number): string {
    if (!Number.isFinite(updatedAt) || Number(updatedAt) <= 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return formatDateTime(Number(updatedAt), {defaultValue: EMPTY_DATA_PLACEHOLDER});
}
