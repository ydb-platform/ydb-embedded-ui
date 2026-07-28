import React from 'react';

import type {ECapacityAlert} from '../../../../types/api/enums';

import {getSpaceLegendSelection} from './getSpaceLegendSelection';

/**
 * Hook to get the set of inactive (deselected) legend items for Space mode
 * Returns a Set of ECapacityAlert values that are currently deselected in the legend
 * Automatically updates when legend selection changes
 */
export function useSpaceLegendSelection(): Set<ECapacityAlert> {
    const [selection, setSelection] = React.useState<Set<ECapacityAlert>>(getSpaceLegendSelection);

    React.useEffect(() => {
        const handleLegendChange = () => {
            setSelection(getSpaceLegendSelection());
        };

        window.addEventListener('spaceLegendChange', handleLegendChange);
        return () => {
            window.removeEventListener('spaceLegendChange', handleLegendChange);
        };
    }, []);

    return selection;
}
