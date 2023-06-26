import {RadioButton} from '@gravity-ui/uikit';

import type {StorageType} from '../../../store/reducers/storage/types';
import {STORAGE_TYPES} from '../../../store/reducers/storage/constants';

const StorageTypesTitles = {
    [STORAGE_TYPES.groups]: 'Groups',
    [STORAGE_TYPES.nodes]: 'Nodes',
};

interface StorageTypeFilterProps {
    value: StorageType;
    onChange: (value: string) => void;
}

export const StorageTypeFilter = ({value, onChange}: StorageTypeFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange}>
            <RadioButton.Option value={STORAGE_TYPES.groups}>
                {StorageTypesTitles[STORAGE_TYPES.groups]}
            </RadioButton.Option>
            <RadioButton.Option value={STORAGE_TYPES.nodes}>
                {StorageTypesTitles[STORAGE_TYPES.nodes]}
            </RadioButton.Option>
        </RadioButton>
    );
};
