import React from 'react';

import i18n from '../../containers/Tenant/Diagnostics/Overview/TableInfo/i18n';
import {operationsApi} from '../../store/reducers/operations';
import createToast from '../createToast';
import type {StartTableCompactionParams} from '../tableCompaction';

/**
 * Hook that provides a function to start table compaction with toast notification.
 * Combines the RTK Query mutation with automatic success toast display.
 * @returns Function to start compaction with parameters (database, path, cascade, parallel)
 */
export function useStartCompaction() {
    const [startTableCompaction] = operationsApi.useStartTableCompactionMutation();

    return React.useCallback(
        async (params: StartTableCompactionParams) => {
            await startTableCompaction(params).unwrap();

            createToast({
                name: 'startTableCompaction',
                content: i18n('toast_compaction-started'),
                autoHiding: 3000,
                isClosable: true,
            });
        },
        [startTableCompaction],
    );
}
