import React from 'react';

import {DrawerContextProvider} from '../../components/Drawer/DrawerContext';

import {TenantDrawerHealthcheck} from './TenantDrawerHealthcheck';
import {TenantDrawerRights} from './TenantDrawerRights';

interface TenantDrawerWrapperProps {
    children: React.ReactNode;
}

export function TenantDrawerWrapper({children}: TenantDrawerWrapperProps) {
    return (
        <DrawerContextProvider>
            <TenantDrawerHealthcheck>
                <TenantDrawerRights>{children}</TenantDrawerRights>
            </TenantDrawerHealthcheck>
        </DrawerContextProvider>
    );
}
