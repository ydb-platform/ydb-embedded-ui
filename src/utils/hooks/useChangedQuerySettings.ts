import getChangedQueryExecutionSettings from '../../containers/Tenant/Query/QueryEditorControls/utils/getChangedQueryExecutionSettings';
import getChangedQueryExecutionSettingsDescription from '../../containers/Tenant/Query/QueryEditorControls/utils/getChangedQueryExecutionSettingsDescription';
import {QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY, WEEK_IN_SECONDS} from '../constants';
import {DEFAULT_QUERY_SETTINGS} from '../query';

import {useLastQueryExecutionSettings} from './useLastQueryExecutionSettings';
import {useQueryExecutionSettings} from './useQueryExecutionSettings';
import {useSetting} from './useSetting';

export const useChangedQuerySettings = () => {
    const [bannerLastClosedTimestamp, setBannerLastClosedTimestamp] = useSetting<
        number | undefined
    >(QUERY_SETTINGS_BANNER_LAST_CLOSED_KEY);
    const [lastQuerySettings] = useLastQueryExecutionSettings();
    const [currentQuerySettings] = useQueryExecutionSettings();

    const changedLastExucutionSettings = lastQuerySettings
        ? getChangedQueryExecutionSettings(lastQuerySettings, DEFAULT_QUERY_SETTINGS)
        : [];

    const changedCurrentSettings = currentQuerySettings
        ? getChangedQueryExecutionSettings(currentQuerySettings, DEFAULT_QUERY_SETTINGS)
        : [];

    const hasChangedLastExucutionSettings = changedLastExucutionSettings.length > 0;

    const changedLastExecutionSettingsDescriptions = lastQuerySettings
        ? getChangedQueryExecutionSettingsDescription({
              currentSettings: lastQuerySettings,
              defaultSettings: DEFAULT_QUERY_SETTINGS,
          })
        : {};

    const changedCurrentSettingsDescriptions = currentQuerySettings
        ? getChangedQueryExecutionSettingsDescription({
              currentSettings: currentQuerySettings,
              defaultSettings: DEFAULT_QUERY_SETTINGS,
          })
        : {};

    const isClosedRecently =
        bannerLastClosedTimestamp &&
        Date.now() - bannerLastClosedTimestamp < WEEK_IN_SECONDS * 1000;

    const isBannerShown = hasChangedLastExucutionSettings && !isClosedRecently;
    const isIndicatorShown = hasChangedLastExucutionSettings && isClosedRecently;

    const closeBanner = () => setBannerLastClosedTimestamp(Date.now());

    const resetBanner = () => setBannerLastClosedTimestamp(undefined);

    return {
        isBannerShown,
        isIndicatorShown,
        closeBanner,
        resetBanner,

        changedCurrentSettings,
        changedCurrentSettingsDescriptions,

        changedLastExucutionSettings,
        changedLastExecutionSettingsDescriptions,
    };
};
