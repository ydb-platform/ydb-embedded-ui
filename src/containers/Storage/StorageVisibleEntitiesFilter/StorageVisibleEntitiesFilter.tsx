import {RadioButton} from '@gravity-ui/uikit';

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
        <RadioButton value={value} onUpdate={onChange} qa={storageVisibleEntitiesFilterQa}>
            <RadioButton.Option value={VISIBLE_ENTITIES.missing}>
                {VisibleEntitiesTitles[VISIBLE_ENTITIES.missing]}
            </RadioButton.Option>
            <RadioButton.Option value={VISIBLE_ENTITIES.space}>
                {VisibleEntitiesTitles[VISIBLE_ENTITIES.space]}
            </RadioButton.Option>
            <RadioButton.Option value={VISIBLE_ENTITIES.all}>
                {VisibleEntitiesTitles[VISIBLE_ENTITIES.all]}
            </RadioButton.Option>
        </RadioButton>
    );
};
