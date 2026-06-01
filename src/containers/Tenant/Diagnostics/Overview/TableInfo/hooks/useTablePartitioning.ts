import React from 'react';

import {tablePartitioningApi} from '../../../../../../store/reducers/tablePartitioning/tablePartitioning';
import createToast from '../../../../../../utils/createToast';
import {reachMetricaGoal} from '../../../../../../utils/yaMetrica';
import {openManagePartitioningDialog} from '../ManagePartitioningDialog/ManagePartitioningDialog';
import type {ManagePartitioningFormState} from '../ManagePartitioningDialog/types';
import i18n from '../i18n';
import {prepareUpdatePartitioningRequest} from '../utils';

interface UseTablePartitioningResult {
    handleOpenManagePartitioning: () => void;
}

/**
 * Hook for managing table partitioning configuration.
 * Handles opening the partitioning dialog and applying changes.
 * @param database - Database path
 * @param path - Table path
 * @param managePartitioningDialogConfig - Initial configuration for the dialog
 * @returns Handler for opening the manage partitioning dialog
 */
export function useTablePartitioning(
    database: string,
    path: string,
    managePartitioningDialogConfig?: ManagePartitioningFormState,
): UseTablePartitioningResult {
    const [updatePartitioning] = tablePartitioningApi.useUpdateTablePartitioningMutation();

    const handleOpenManagePartitioning = React.useCallback(() => {
        if (!managePartitioningDialogConfig) {
            return;
        }

        reachMetricaGoal('openManagePartitioning');
        openManagePartitioningDialog({
            initialValue: managePartitioningDialogConfig,
            onApply: async (value) => {
                reachMetricaGoal('applyManagePartitioning');
                await updatePartitioning(
                    prepareUpdatePartitioningRequest(value, database, path),
                ).unwrap();

                createToast({
                    name: 'updateTablePartitioning',
                    content: i18n('toast_partitioning-updated'),
                    autoHiding: 3000,
                    isClosable: true,
                });
            },
        });
    }, [managePartitioningDialogConfig, database, path, updatePartitioning]);

    return {handleOpenManagePartitioning};
}
