import React from 'react';

import {EntitiesCount} from '../../../../components/EntitiesCount';
import {Search} from '../../../../components/Search';
import i18n from '../i18n';

interface NodeNetworkControlsProps {
    searchValue: string;
    onSearchChange: (value: string) => void;

    entitiesCountCurrent: number;
    entitiesCountTotal: number;
    entitiesLoading: boolean;
}

export function NodeNetworkControls({
    searchValue,
    onSearchChange,
    entitiesCountCurrent,
    entitiesCountTotal,
    entitiesLoading,
}: NodeNetworkControlsProps) {
    return (
        <React.Fragment>
            <Search
                value={searchValue}
                onChange={onSearchChange}
                placeholder={i18n('search-placeholder')}
                width={238}
            />
            <EntitiesCount
                current={entitiesCountCurrent}
                total={entitiesCountTotal}
                label={i18n('field_peers')}
                loading={entitiesLoading}
            />
        </React.Fragment>
    );
}
