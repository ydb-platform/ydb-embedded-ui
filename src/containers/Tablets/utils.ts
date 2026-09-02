interface FilterTabletsOptions {
    tabletIdSearch?: string | null;
    tabletTypes: string[];
}

interface FilterableTablet {
    TabletId?: string;
    Type?: string;
}

export function filterTablets<T extends FilterableTablet>(
    tablets: T[],
    options: FilterTabletsOptions,
) {
    const tabletIdSearch = options.tabletIdSearch?.trim() ?? '';
    const tabletTypes = new Set(options.tabletTypes);

    if (!tabletIdSearch && tabletTypes.size === 0) {
        return tablets;
    }

    return tablets.filter((tablet) => {
        const matchesTabletId = String(tablet.TabletId).includes(tabletIdSearch);
        const matchesTabletType =
            tabletTypes.size === 0 || (tablet.Type !== undefined && tabletTypes.has(tablet.Type));

        return matchesTabletId && matchesTabletType;
    });
}

export function getAvailableTabletTypes<T extends FilterableTablet>(
    tablets: T[],
    selectedTabletTypes: string[],
) {
    const availableTabletTypes = new Set(selectedTabletTypes);
    tablets.forEach((tablet) => {
        if (tablet.Type) {
            availableTabletTypes.add(tablet.Type);
        }
    });

    return Array.from(availableTabletTypes).sort();
}
