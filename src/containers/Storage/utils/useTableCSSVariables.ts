import React from 'react';

import type {PaginatedTableData} from '../../../components/PaginatedTable/types';
import type {PreparedStorageNode} from '../../../store/reducers/storage/types';

// Constants moved from PaginatedStorageNodes.tsx
const MAX_SLOTS_CSS_VAR = '--maximum-slots';
const MAX_DISKS_CSS_VAR = '--maximum-disks';

/**
 * Hook to manage table style based on column settings
 *
 * @returns An object with tableStyle and handleDataFetched
 */
export function useTableCSSVariables() {
    const [tableStyle, setTableStyle] = React.useState<React.CSSProperties | undefined>(undefined);

    const handleDataFetched = React.useCallback((data: PaginatedTableData<PreparedStorageNode>) => {
        if (data?.columnSettings) {
            const {maxSlotsPerDisk, maxDisksPerNode} = data.columnSettings;
            setTableStyle({
                [MAX_SLOTS_CSS_VAR]: maxSlotsPerDisk,
                [MAX_DISKS_CSS_VAR]: maxDisksPerNode,
            } as React.CSSProperties);
        }
    }, []);

    return {
        tableStyle,
        handleDataFetched,
    };
}
