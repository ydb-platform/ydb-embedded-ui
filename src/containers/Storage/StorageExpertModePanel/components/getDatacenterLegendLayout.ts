interface DatacenterLegendWidths {
    labels: readonly number[];
    available: number;
    unknown: number;
    more: number;
    gap: number;
}

export function getDatacenterLegendLayout({
    labels,
    available,
    unknown,
    more,
    gap,
}: DatacenterLegendWidths) {
    const total = labels.reduce((width, label) => width + label + gap, unknown);
    if (total <= available) {
        return {visibleCount: labels.length, showUnknown: true};
    }

    const showUnknown = unknown + gap + more <= available;
    let used = more + (showUnknown ? unknown + gap : 0);
    let visibleCount = 0;
    for (const width of labels) {
        if (used + gap + width > available) {
            break;
        }
        used += gap + width;
        visibleCount++;
    }
    return {visibleCount, showUnknown};
}
