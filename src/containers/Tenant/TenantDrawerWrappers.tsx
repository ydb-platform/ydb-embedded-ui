import React from 'react';

import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';

import {TenantDrawerHealthcheck} from './TenantDrawerHealthcheck';
import {TenantDrawerRights} from './TenantDrawerRights';

interface TenantDrawerWrapperProps {
    children: React.ReactNode;
}

export function TenantDrawerWrapper({children}: TenantDrawerWrapperProps) {
    const clusterName = useClusterNameFromQuery();

    return (
        <TenantDrawerHealthcheck clusterName={clusterName}>
            <TenantDrawerRights>{children}</TenantDrawerRights>
        </TenantDrawerHealthcheck>
    );
}
