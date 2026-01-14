import React from 'react';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';

import type {ManagePartitioningFormState} from './types';
import {getManagePartitioningInitialValues, managePartitioningSchema} from './utils';

export function useManagePartitioningForm(params: {
    initialValue?: ManagePartitioningFormState;
    maxSplitSizeBytes: number;
}) {
    const {initialValue, maxSplitSizeBytes} = params;

    const schema = React.useMemo(
        () => managePartitioningSchema(maxSplitSizeBytes),
        [maxSplitSizeBytes],
    );

    const form = useForm<ManagePartitioningFormState>({
        defaultValues: getManagePartitioningInitialValues(initialValue),
        resolver: zodResolver(schema),
        mode: 'onChange',
    });

    return form;
}
