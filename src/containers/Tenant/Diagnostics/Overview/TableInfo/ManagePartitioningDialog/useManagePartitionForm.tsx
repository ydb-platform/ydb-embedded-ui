import React from 'react';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';

import type {ManagePartitioningValue} from './ManagePartitioningDialog';
import {getManagePartitioningInitialValues, managePartitioningSchema, toFormValues} from './utils';
import type {ManagePartitioningFormValues} from './utils';

export function useManagePartitioningForm(params: {
    initialValue?: ManagePartitioningValue;
    maxSplitSizeBytes: number;
}) {
    const {initialValue, maxSplitSizeBytes} = params;

    const schema = React.useMemo(
        () => managePartitioningSchema(maxSplitSizeBytes),
        [maxSplitSizeBytes],
    );

    const form = useForm<ManagePartitioningFormValues>({
        defaultValues: toFormValues(getManagePartitioningInitialValues(initialValue)),
        resolver: zodResolver(schema),
        mode: 'onChange',
    });

    return form;
}
