import {RadioButton} from '@gravity-ui/uikit';

import type {StorageType} from '../../../store/reducers/storage/types';
import {StorageTypes} from '../../../store/reducers/storage/constants';

const StorageTypesTitles = {
    [StorageTypes.groups]: 'Groups',
    [StorageTypes.nodes]: 'Nodes',
};

interface StorageTypeFilterProps {
    value: StorageType;
    onChange: (value: string) => void;
}

export const StorageTypeFilter = ({value, onChange}: StorageTypeFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange}>
            <RadioButton.Option value={StorageTypes.groups}>
                {StorageTypesTitles[StorageTypes.groups]}
            </RadioButton.Option>
            <RadioButton.Option value={StorageTypes.nodes}>
                {StorageTypesTitles[StorageTypes.nodes]}
            </RadioButton.Option>
        </RadioButton>
    );
};
