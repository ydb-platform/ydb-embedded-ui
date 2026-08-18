import {ECapacityAlert, isCapacityAlert} from '../../../../types/api/enums';
import {loadFromSessionStorage, saveToSessionStorage} from '../../../../utils';

export const SPACE_LEGEND_STORAGE_KEY = 'ydb-space-legend-inactive';
export const SPACE_LEGEND_CHANGE_EVENT = 'spaceLegendChange';

export type SpaceLegendSelectionScope = 'vdisks' | 'pdisks';

// By default, GREEN and CYAN are inactive (deselected)
const defaultInactive = new Set([ECapacityAlert.GREEN, ECapacityAlert.CYAN]);

function getStorageKey(scope: SpaceLegendSelectionScope) {
    return scope === 'vdisks' ? SPACE_LEGEND_STORAGE_KEY : `${SPACE_LEGEND_STORAGE_KEY}-${scope}`;
}

function getChangeEvent(scope: SpaceLegendSelectionScope) {
    return scope === 'vdisks' ? SPACE_LEGEND_CHANGE_EVENT : `${SPACE_LEGEND_CHANGE_EVENT}-${scope}`;
}

function loadInactiveItems(scope: SpaceLegendSelectionScope): Set<ECapacityAlert> {
    const stored = loadFromSessionStorage(getStorageKey(scope));

    if (Array.isArray(stored)) {
        const normalizedStored = new Set<ECapacityAlert>();
        stored.forEach((item) => {
            if (isCapacityAlert(item)) {
                normalizedStored.add(item);
            }
        });
        return normalizedStored;
    }

    return new Set(defaultInactive);
}

/**
 * Get the set of inactive (deselected) capacityAlert values for Space mode legend
 * Returns a Set of ECapacityAlert values that are currently deselected in the legend
 */
export function getSpaceLegendSelection(
    scope: SpaceLegendSelectionScope = 'vdisks',
): Set<ECapacityAlert> {
    return loadInactiveItems(scope);
}

export function saveSpaceLegendSelection(
    selection: Set<ECapacityAlert>,
    scope: SpaceLegendSelectionScope = 'vdisks',
): void {
    saveToSessionStorage(getStorageKey(scope), Array.from(selection));
    window.dispatchEvent(new CustomEvent(getChangeEvent(scope)));
}
