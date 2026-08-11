import React from 'react';

import type {ECapacityAlert} from '../../../../types/api/enums';

import {SPACE_LEGEND_CHANGE_EVENT, getSpaceLegendSelection} from './getSpaceLegendSelection';
import type {SpaceLegendSelectionScope} from './getSpaceLegendSelection';

/**
 * Hook to get the set of inactive (deselected) legend items for Space mode
 * Returns a Set of ECapacityAlert values that are currently deselected in the legend
 * Automatically updates when legend selection changes
 */
function getChangeEvent(scope: SpaceLegendSelectionScope) {
    return scope === 'vdisks' ? SPACE_LEGEND_CHANGE_EVENT : `${SPACE_LEGEND_CHANGE_EVENT}-${scope}`;
}

export function useSpaceLegendSelection(
    scope: SpaceLegendSelectionScope = 'vdisks',
): Set<ECapacityAlert> {
    const [selection, setSelection] = React.useState<Set<ECapacityAlert>>(() =>
        getSpaceLegendSelection(scope),
    );

    React.useEffect(() => {
        const handleLegendChange = () => {
            setSelection(getSpaceLegendSelection(scope));
        };

        const changeEvent = getChangeEvent(scope);
        window.addEventListener(changeEvent, handleLegendChange);
        return () => {
            window.removeEventListener(changeEvent, handleLegendChange);
        };
    }, [scope]);

    return selection;
}
