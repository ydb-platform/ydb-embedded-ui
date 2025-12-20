import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {selectUser} from '../../store/reducers/authentication/authentication';
import {settingsApi} from '../../store/reducers/settings/api';
import {DEFAULT_USER_SETTINGS} from '../../store/reducers/settings/constants';
import {uiFactory} from '../../uiFactory/uiFactory';
import {
    DEFAULT_CLUSTER_TAB_KEY,
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
    DEFAULT_IS_TENANT_SUMMARY_COLLAPSED,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    DEFAULT_SIZE_TENANT_KEY,
    DEFAULT_SIZE_TENANT_SUMMARY_KEY,
} from '../../utils/constants';
import {useTypedSelector} from '../../utils/hooks/useTypedSelector';

const DRAWER_WIDTH_KEY = 'drawer-width';

/**
 * Preloaded keys for "UI layout" state (pane sizes, collapsed flags, etc.) that are stored in the same
 * settings backend but are not part of `DEFAULT_USER_SETTINGS`.
 *
 * If a new UI layout key should be preloaded to prevent UI "pop-in" in remote-settings mode, add it here.
 */
const PRELOADED_UI_LAYOUT_KEYS = [
    DEFAULT_CLUSTER_TAB_KEY,
    DEFAULT_SIZE_RESULT_PANE_KEY,
    DEFAULT_SIZE_TENANT_SUMMARY_KEY,
    DEFAULT_SIZE_TENANT_KEY,
    DEFAULT_IS_TENANT_SUMMARY_COLLAPSED,
    DEFAULT_IS_TENANT_COMMON_INFO_COLLAPSED,
    DEFAULT_IS_QUERY_RESULT_COLLAPSED,
    DRAWER_WIDTH_KEY,
] as const;

interface SettingsBootstrapProps {
    children: React.ReactNode;
}

export function SettingsBootstrap({children}: SettingsBootstrapProps) {
    const fallbackUser = useTypedSelector(selectUser);
    const userFromFactory = uiFactory.settingsBackend?.getUserId?.();
    const remoteAvailable = Boolean(window.api?.metaSettings);

    const user = userFromFactory ?? fallbackUser;

    const settingsKeysToPreload = React.useMemo(() => {
        const keys = new Set<string>(Object.keys(DEFAULT_USER_SETTINGS));

        PRELOADED_UI_LAYOUT_KEYS.forEach((key) => keys.add(key));

        return Array.from(keys);
    }, []);

    const params = React.useMemo(() => {
        if (user && remoteAvailable) {
            return {user, name: settingsKeysToPreload};
        }
        return skipToken;
    }, [remoteAvailable, user, settingsKeysToPreload]);

    const {isLoading} = settingsApi.useGetSettingsQuery(params);

    if (!remoteAvailable) {
        return children;
    }

    return (
        <LoaderWrapper loading={isLoading} size="l" delay={0}>
            {children}
        </LoaderWrapper>
    );
}
