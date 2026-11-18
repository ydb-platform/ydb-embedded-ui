import type {ResponseDataQuality} from './types';

interface RawResponseDataQuality {
    Problems?: unknown;
    NeedFilter?: unknown;
    NeedSort?: unknown;
    NeedGroup?: unknown;
}

function prepareResponseProblems(problems: unknown): string[] {
    if (!Array.isArray(problems)) {
        return [];
    }

    const uniqueProblems = new Set<string>();
    for (const problem of problems) {
        if (typeof problem === 'string' && problem) {
            uniqueProblems.add(problem);
        }
    }

    return Array.from(uniqueProblems);
}

/** Older backends do not send these fields: absent values mean "nothing to report" */
export function prepareResponseDataQuality(response: RawResponseDataQuality): ResponseDataQuality {
    return {
        problems: prepareResponseProblems(response.Problems),
        needFilter: response.NeedFilter === true,
        needSort: response.NeedSort === true,
        needGroup: response.NeedGroup === true,
    };
}

export function mergeDataQuality(
    items: (ResponseDataQuality | undefined)[],
): ResponseDataQuality | undefined {
    const definedItems = items.filter((item): item is ResponseDataQuality => Boolean(item));

    if (!definedItems.length) {
        return undefined;
    }

    return {
        problems: Array.from(new Set(definedItems.flatMap((item) => item.problems))),
        needFilter: definedItems.some((item) => item.needFilter),
        needSort: definedItems.some((item) => item.needSort),
        needGroup: definedItems.some((item) => item.needGroup),
    };
}

/** The same flags and the same set of problem codes; the order of the codes does not matter */
export function isSameDataQuality(a?: ResponseDataQuality, b?: ResponseDataQuality) {
    if (!a || !b) {
        return a === b;
    }

    return (
        a.needFilter === b.needFilter &&
        a.needSort === b.needSort &&
        a.needGroup === b.needGroup &&
        a.problems.length === b.problems.length &&
        a.problems.every((problem) => b.problems.includes(problem))
    );
}

/** Nothing to tell the user about: no failed sources and every requested operation was applied */
export function isCleanDataQuality(quality: ResponseDataQuality) {
    return (
        quality.problems.length === 0 &&
        !quality.needFilter &&
        !quality.needSort &&
        !quality.needGroup
    );
}
