import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {STORAGE_TYPES} from '../../../store/reducers/storage/constants';
import type {StorageType} from '../../../store/reducers/storage/types';

const StorageTypesTitles = {
    [STORAGE_TYPES.groups]: 'Groups',
    [STORAGE_TYPES.nodes]: 'Nodes',
};

interface StorageTypeFilterProps {
    value: StorageType;
    onChange: (value: StorageType) => void;
}

const storageTypeFilterQa = 'storage-type-filter';

export const StorageTypeFilter = ({value, onChange}: StorageTypeFilterProps) => {
    return (
        <SegmentedRadioGroup value={value} onUpdate={onChange} qa={storageTypeFilterQa}>
            <SegmentedRadioGroup.Option value={STORAGE_TYPES.groups}>
                {StorageTypesTitles[STORAGE_TYPES.groups]}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={STORAGE_TYPES.nodes}>
                {StorageTypesTitles[STORAGE_TYPES.nodes]}
            </SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
    );
};
