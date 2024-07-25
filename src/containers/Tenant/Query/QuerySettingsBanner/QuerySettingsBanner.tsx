import {Banner} from '../../../../components/Banner/Banner';
import {cn} from '../../../../utils/cn';
import {useChangedQuerySettingsIndicator} from '../../../../utils/hooks/useChangedQuerySettingsIndicator';
import i18n from '../i18n';
const b = cn('ydb-query-settings-banner');

import './QuerySettingsBanner.scss';

export function QuerySettingsBanner() {
    const {isBannerShown, changedSettingsDescription, closeBanner} =
        useChangedQuerySettingsIndicator();
    return isBannerShown ? (
        <Banner
            className={b()}
            onClose={closeBanner}
            message={
                <div
                    dangerouslySetInnerHTML={{
                        __html: i18n('banner.query-settings.message', {
                            message: changedSettingsDescription,
                        }),
                    }}
                />
            }
        />
    ) : null;
}
