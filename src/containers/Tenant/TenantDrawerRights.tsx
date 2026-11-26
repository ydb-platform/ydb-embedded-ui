import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import {DrawerWrapper} from '../../components/Drawer';
import {selectDatabaseCapabilities} from '../../store/reducers/capabilities/capabilities';
import {useEditAccessAvailable} from '../../store/reducers/capabilities/hooks';
import {uiFactory} from '../../uiFactory/uiFactory';
import {useTypedSelector} from '../../utils/hooks';

import {GrantAccess} from './GrantAccess/GrantAccess';
import {useCurrentSchema} from './TenantContext';
import i18n from './i18n';
import {useTenantQueryParams} from './useTenantQueryParams';

interface TenantDrawerWrapperProps {
    children: React.ReactNode;
}

export function TenantDrawerRights({children}: TenantDrawerWrapperProps) {
    const editable = useEditAccessAvailable();
    const schema = useCurrentSchema();
    const getDrawerProps = uiFactory.access?.getDrawerProps;
    const capabilities = useTypedSelector((state) =>
        getDrawerProps ? selectDatabaseCapabilities(state, schema.database).data : undefined,
    );
    const {showGrantAccess, handleShowGrantAccessChange, handleAclSubjectChange} =
        useTenantQueryParams();

    const handleCloseDrawer = React.useCallback(() => {
        handleShowGrantAccessChange(false);
        handleAclSubjectChange(undefined);
    }, [handleShowGrantAccessChange, handleAclSubjectChange]);

    const renderDrawerContent = React.useCallback(() => {
        return <GrantAccess handleCloseDrawer={handleCloseDrawer} />;
    }, [handleCloseDrawer]);

    const customDrawerProps = getDrawerProps?.({...schema, capabilities}, handleCloseDrawer);
    if (!editable && !customDrawerProps) {
        return children;
    }

    const drawerProps = customDrawerProps ?? {
        renderDrawerContent,
        drawerId: 'tenant-grant-access',
        storageKey: 'tenant-grant-access-drawer-width',
        isPercentageWidth: true,
        title: <DrawerTitle />,
    };

    return (
        <DrawerWrapper
            {...drawerProps}
            isDrawerVisible={Boolean(showGrantAccess)}
            onCloseDrawer={handleCloseDrawer}
            detectClickOutside
            hideVeil={false}
            drawerControls={[{type: 'close'}]}
        >
            {children}
        </DrawerWrapper>
    );
}

function DrawerTitle() {
    return (
        <Flex direction="column">
            <Text variant="subheader-2">{i18n('title_grant-access')}</Text>
            <Text color="secondary">{i18n('context_granular-rights-groups')}</Text>
        </Flex>
    );
}
