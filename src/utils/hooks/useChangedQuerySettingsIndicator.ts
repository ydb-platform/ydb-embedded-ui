import React from 'react';

import getChangedQueryExecutionSettings from '../../containers/Tenant/Query/QueryEditorControls/utils/getChangedQueryExecutionSettings';
import getChangedQueryExecutionSettingsDescription from '../../containers/Tenant/Query/QueryEditorControls/utils/getChangedQueryExecutionSettingsDescription';
import {
    DEFAULT_QUERY_SETTINGS,
    QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY,
    WEEK_IN_SECONDS,
} from '../constants';

import {useLastQueryExecutionSettings} from './useLastQueryExecutionSettings';
import {useSetting} from './useSetting';

export const useChangedQuerySettingsIndicator = () => {
    const [bannerLastClosedTimestamp, setBannerLastClosedTimestamp] = useSetting<
        number | undefined
    >(QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY);
    const [isBannerShown, setIsBannerShown] = React.useState(false);
    const [isIndicatorShown, setIsIndicatorShown] = React.useState(false);
    const [changedSettings, setChangedSettings] = React.useState<string[]>([]);
    const [lastQuerySettings] = useLastQueryExecutionSettings();
    const changedSettingsArray = React.useMemo(() => {
        return lastQuerySettings
            ? getChangedQueryExecutionSettings(lastQuerySettings, DEFAULT_QUERY_SETTINGS)
            : [];
    }, [lastQuerySettings]);

    const changedSettingsDescription = React.useMemo(() => {
        return lastQuerySettings
            ? getChangedQueryExecutionSettingsDescription({
                  currentSettings: lastQuerySettings,
                  defaultSettings: DEFAULT_QUERY_SETTINGS,
              })
            : '';
    }, [lastQuerySettings]);

    const checkIndicatorVisibility = React.useCallback(() => {
        setChangedSettings(changedSettingsArray);

        const hasChangedSettings = changedSettingsArray.length > 0;
        const isClosedRecently =
            bannerLastClosedTimestamp &&
            Date.now() - bannerLastClosedTimestamp < WEEK_IN_SECONDS * 1000;

        setIsBannerShown(hasChangedSettings && !isClosedRecently);
        setIsIndicatorShown(Boolean(hasChangedSettings && isClosedRecently));
    }, [changedSettingsArray, bannerLastClosedTimestamp]);

    React.useEffect(() => {
        checkIndicatorVisibility();
    }, [checkIndicatorVisibility]);

    const closeBanner = React.useCallback(() => {
        setBannerLastClosedTimestamp(Date.now());
        setIsBannerShown(false);
        setIsIndicatorShown(true);
    }, [setBannerLastClosedTimestamp]);

    const resetBanner = React.useCallback(() => {
        setBannerLastClosedTimestamp(undefined);
    }, [setBannerLastClosedTimestamp]);

    return {
        isBannerShown,
        isIndicatorShown,
        closeBanner,
        resetBanner,
        changedSettings,
        changedSettingsDescription,
    };
};
