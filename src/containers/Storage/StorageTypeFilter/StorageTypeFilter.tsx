import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {STORAGE_TYPES} from '../../../store/reducers/storage/constants';
import type {StorageType} from '../../../store/reducers/storage/types';
import {useNbsStorageAvailableInClusterView} from '../../../utils/hooks/useNbsStorageAvailability';
import i18n from '../NbsStorage/i18n';

interface StorageTypeFilterProps {
    value: StorageType;
    onChange: (value: StorageType) => void;
}

export const StorageTypeFilter = ({value, onChange}: StorageTypeFilterProps) => {
    const nbsAvailable = useNbsStorageAvailableInClusterView();
    const options: {value: StorageType; content: string}[] = [
        {value: STORAGE_TYPES.groups, content: 'Groups'},
        {value: STORAGE_TYPES.nodes, content: 'Nodes'},
    ];
    if (nbsAvailable) {
        options.push(
            {value: STORAGE_TYPES.nbs, content: i18n('nbs-tablets')},
            {value: STORAGE_TYPES.ddisks, content: i18n('disk')},
        );
    }
    const selectedValue =
        !nbsAvailable && (value === 'nbs' || value === 'ddisks') ? 'groups' : value;
    return (
        <SegmentedRadioGroup
            value={selectedValue}
            onUpdate={onChange}
            options={options}
            qa="storage-type-filter"
        />
    );
};
