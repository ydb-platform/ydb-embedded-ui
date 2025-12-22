import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import {DrawerWrapper} from '../../components/Drawer';
import {useEditAccessAvailable} from '../../store/reducers/capabilities/hooks';

import {GrantAccess} from './GrantAccess/GrantAccess';
import i18n from './i18n';
import {useTenantQueryParams} from './useTenantQueryParams';

interface TenantDrawerWrapperProps {
    children: React.ReactNode;
}

export function TenantDrawerRights({children}: TenantDrawerWrapperProps) {
    const editable = useEditAccessAvailable();
    const {showGrantAccess, handleShowGrantAccessChange, handleAclSubjectChange} =
        useTenantQueryParams();

    const handleCloseDrawer = React.useCallback(() => {
        handleShowGrantAccessChange(false);
        handleAclSubjectChange(undefined);
    }, [handleShowGrantAccessChange, handleAclSubjectChange]);

    const renderDrawerContent = React.useCallback(() => {
        return <GrantAccess handleCloseDrawer={handleCloseDrawer} />;
    }, [handleCloseDrawer]);

    if (!editable) {
        return children;
    }

    return (
        <DrawerWrapper
            isDrawerVisible={Boolean(showGrantAccess)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="tenant-grant-access"
            storageKey="tenant-grant-access-drawer-width"
            detectClickOutside
            hideVeil={false}
            isPercentageWidth
            drawerControls={[{type: 'close'}]}
            title={<DrawerTitle />}
        >
            {children}
        </DrawerWrapper>
    );
}

function DrawerTitle() {
    return (
        <Flex direction="column">
            <Text variant="subheader-2">{i18n('label_grant-access')}</Text>
            <Text color="secondary">{i18n('context_grant-access')}</Text>
        </Flex>
    );
}
