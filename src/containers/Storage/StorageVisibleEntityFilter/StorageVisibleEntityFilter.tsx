import {RadioButton} from '@gravity-ui/uikit';

import type {VisibleEntities} from '../../../store/reducers/storage/types';
import {VISIBLE_ENTITIES} from '../../../store/reducers/storage/constants';

export const VisibleEntitiesTitles = {
    [VISIBLE_ENTITIES.all]: 'All',
    [VISIBLE_ENTITIES.missing]: 'Degraded',
    [VISIBLE_ENTITIES.space]: 'Out of Space',
};

interface StorageProblemFilterProps {
    value: VisibleEntities;
    onChange: (value: string) => void;
}

export const StorageVisibleEntityFilter = ({value, onChange}: StorageProblemFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange}>
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
