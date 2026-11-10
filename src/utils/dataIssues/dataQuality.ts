import type {ResponseDataQuality, TableDataQualityReport} from './types';

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

export function getResponseDataQuality(
    response?: Partial<ResponseDataQuality>,
): ResponseDataQuality | undefined {
    if (!response) {
        return undefined;
    }

    return {
        problems: response.problems ?? [],
        needFilter: Boolean(response.needFilter),
        needSort: Boolean(response.needSort),
        needGroup: Boolean(response.needGroup),
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

export function isSameDataQuality(a: ResponseDataQuality, b: ResponseDataQuality) {
    return (
        a.needFilter === b.needFilter &&
        a.needSort === b.needSort &&
        a.needGroup === b.needGroup &&
        a.problems.length === b.problems.length &&
        a.problems.every((problem, index) => problem === b.problems[index])
    );
}

interface TableRequestDescription {
    filters?: unknown;
    sortParams?: unknown;
}

export function createTableDataQualityReport(
    response: Partial<ResponseDataQuality>,
    {filters, sortParams}: TableRequestDescription,
): TableDataQualityReport {
    return {
        problems: response.problems ?? [],
        needFilter: Boolean(response.needFilter),
        needSort: Boolean(response.needSort),
        needGroup: Boolean(response.needGroup),
        receivedAt: Date.now(),
        requestKey: JSON.stringify([filters ?? null, sortParams ?? null]),
    };
}
