import getChangedQueryExecutionSettings from '../../containers/Tenant/Query/QueryEditorControls/utils/getChangedQueryExecutionSettings';
import getChangedQueryExecutionSettingsDescription from '../../containers/Tenant/Query/QueryEditorControls/utils/getChangedQueryExecutionSettingsDescription';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';
import {WEEK_IN_SECONDS} from '../constants';
import {DEFAULT_QUERY_SETTINGS} from '../query';

import {useLastQueryExecutionSettings} from './useLastQueryExecutionSettings';
import {useQueryExecutionSettings} from './useQueryExecutionSettings';

export const useChangedQuerySettings = () => {
    const {value: bannerLastClosedTimestamp, saveValue: setBannerLastClosedTimestamp} = useSetting<
        number | undefined
    >(SETTING_KEYS.QUERY_SETTINGS_BANNER_LAST_CLOSED);
    const [lastQuerySettings] = useLastQueryExecutionSettings();
    const [currentQuerySettings] = useQueryExecutionSettings();

    const changedLastExecutionSettings = lastQuerySettings
        ? getChangedQueryExecutionSettings(lastQuerySettings, DEFAULT_QUERY_SETTINGS)
        : [];

    const changedCurrentSettings = currentQuerySettings
        ? getChangedQueryExecutionSettings(currentQuerySettings, DEFAULT_QUERY_SETTINGS)
        : [];

    const hasChangedImportantSettings =
        changedLastExecutionSettings.includes('transactionMode') ||
        changedLastExecutionSettings.includes('queryMode');

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

    const isBannerShown = hasChangedImportantSettings && !isClosedRecently;

    const closeBanner = () => setBannerLastClosedTimestamp(Date.now());

    const resetBanner = () => setBannerLastClosedTimestamp(undefined);

    return {
        isBannerShown,
        closeBanner,
        resetBanner,

        changedCurrentSettings,
        changedCurrentSettingsDescriptions,

        changedLastExecutionSettings,
        changedLastExecutionSettingsDescriptions,
    };
};
