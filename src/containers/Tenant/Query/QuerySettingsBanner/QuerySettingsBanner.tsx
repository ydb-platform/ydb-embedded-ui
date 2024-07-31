import {Alert} from '@gravity-ui/uikit';

import QuerySettingsDescription from '../../../../components/QuerySettingsDescription/QuerySettingsDescription';
import {cn} from '../../../../utils/cn';
import {useChangedQuerySettings} from '../../../../utils/hooks/useChangedQuerySettings';
import i18n from '../i18n';

const b = cn('ydb-query-settings-banner');

import './QuerySettingsBanner.scss';

export function QuerySettingsBanner() {
    const {isBannerShown, changedLastExecutionSettingsDescriptions, closeBanner} =
        useChangedQuerySettings();
    return isBannerShown ? (
        <Alert
            className={b()}
            theme="info"
            align="baseline"
            message={
                <QuerySettingsDescription
                    prefix={i18n('banner.query-settings.message')}
                    querySettings={changedLastExecutionSettingsDescriptions}
                />
            }
            onClose={closeBanner}
        />
    ) : null;
}
