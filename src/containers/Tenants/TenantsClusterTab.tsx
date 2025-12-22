import React from 'react';

import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {useSetting} from '../../utils/hooks';
import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useDatabasesV2} from '../../utils/hooks/useDatabasesV2';

import {TenantsTable} from './TenantsTable';

interface TenantsTabProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
    additionalTenantsProps?: AdditionalTenantsProps;
}

export function TenantsClusterTab({scrollContainerRef, additionalTenantsProps}: TenantsTabProps) {
    const clusterName = useClusterNameFromQuery();
    const isMetaDatabasesAvailable = useDatabasesV2();
    const [showDomainDatabase] = useSetting<boolean>(SETTING_KEYS.SHOW_DOMAIN_DATABASE);

    return (
        <TenantsTable
            clusterName={clusterName}
            environmentName={undefined}
            isMetaDatabasesAvailable={isMetaDatabasesAvailable}
            showDomainDatabase={showDomainDatabase}
            scrollContainerRef={scrollContainerRef}
            additionalTenantsProps={additionalTenantsProps}
        />
    );
}
