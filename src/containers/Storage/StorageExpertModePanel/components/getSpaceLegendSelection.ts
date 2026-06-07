import {ECapacityAlert, isCapacityAlert} from '../../../../types/api/enums';
import {loadFromSessionStorage, saveToSessionStorage} from '../../../../utils';

const STORAGE_KEY = 'ydb-space-legend-inactive';

// By default, GREEN and CYAN are inactive (deselected)
const defaultInactive = new Set([ECapacityAlert.GREEN, ECapacityAlert.CYAN]);

function loadInactiveItems(): Set<ECapacityAlert> {
    const stored = loadFromSessionStorage(STORAGE_KEY);

    if (Array.isArray(stored)) {
        const normalizedStored = new Set<ECapacityAlert>();
        stored.forEach((item) => {
            if (isCapacityAlert(item)) {
                normalizedStored.add(item);
            }
        });
        return normalizedStored;
    }

    // First time - save default
    saveToSessionStorage(STORAGE_KEY, Array.from(defaultInactive));

    return defaultInactive;
}

/**
 * Get the set of inactive (deselected) capacityAlert values for Space mode legend
 * Returns a Set of ECapacityAlert values that are currently deselected in the legend
 */
export function getSpaceLegendSelection(): Set<ECapacityAlert> {
    return loadInactiveItems();
}
