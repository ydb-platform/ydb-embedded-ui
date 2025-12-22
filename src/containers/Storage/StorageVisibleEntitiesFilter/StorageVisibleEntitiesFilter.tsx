import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';
import type {VisibleEntities} from '../../../store/reducers/storage/types';

const VisibleEntitiesTitles = {
    [VISIBLE_ENTITIES.all]: 'All',
    [VISIBLE_ENTITIES.missing]: 'Degraded',
    [VISIBLE_ENTITIES.space]: 'Out of Space',
};

interface StorageProblemFilterProps {
    value: VisibleEntities;
    onChange: (value: VisibleEntities) => void;
}

const storageVisibleEntitiesFilterQa = 'storage-visible-entities-filter';

export const StorageVisibleEntitiesFilter = ({value, onChange}: StorageProblemFilterProps) => {
    return (
        <SegmentedRadioGroup value={value} onUpdate={onChange} qa={storageVisibleEntitiesFilterQa}>
            <SegmentedRadioGroup.Option value={VISIBLE_ENTITIES.missing}>
                {VisibleEntitiesTitles[VISIBLE_ENTITIES.missing]}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={VISIBLE_ENTITIES.space}>
                {VisibleEntitiesTitles[VISIBLE_ENTITIES.space]}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={VISIBLE_ENTITIES.all}>
                {VisibleEntitiesTitles[VISIBLE_ENTITIES.all]}
            </SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
    );
};
