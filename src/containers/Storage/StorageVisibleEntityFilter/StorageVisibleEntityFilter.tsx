import {RadioButton} from '@gravity-ui/uikit';

import type {VisibleEntity} from '../../../store/reducers/storage/types';
import {VisibleEntities} from '../../../store/reducers/storage/constants';

export const VisibleEntitiesTitles = {
    [VisibleEntities.all]: 'All',
    [VisibleEntities.missing]: 'Degraded',
    [VisibleEntities.space]: 'Out of Space',
};

interface StorageProblemFilterProps {
    value: VisibleEntity;
    onChange: (value: string) => void;
}

export const StorageVisibleEntityFilter = ({value, onChange}: StorageProblemFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange}>
            <RadioButton.Option value={VisibleEntities.missing}>
                {VisibleEntitiesTitles[VisibleEntities.missing]}
            </RadioButton.Option>
            <RadioButton.Option value={VisibleEntities.space}>
                {VisibleEntitiesTitles[VisibleEntities.space]}
            </RadioButton.Option>
            <RadioButton.Option value={VisibleEntities.all}>
                {VisibleEntitiesTitles[VisibleEntities.all]}
            </RadioButton.Option>
        </RadioButton>
    );
};
