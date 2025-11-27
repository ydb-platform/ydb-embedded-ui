import React from 'react';

import {EntitiesCount} from '../../../../components/EntitiesCount';
import {Search} from '../../../../components/Search';

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
                placeholder="Search peers"
                width={238}
            />
            <EntitiesCount
                current={entitiesCountCurrent}
                total={entitiesCountTotal}
                label="Peers"
                loading={entitiesLoading}
            />
        </React.Fragment>
    );
}
