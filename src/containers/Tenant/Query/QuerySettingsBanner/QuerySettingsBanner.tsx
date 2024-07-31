import {Alert} from '@gravity-ui/uikit';

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
                <div className={b('message')}>
                    {i18n('banner.query-settings.message')}
                    {changedLastExecutionSettingsDescriptions.map((description, index, arr) => (
                        <span key={index} className={b('description-item')}>
                            {description}
                            {index < arr.length - 1 ? ', ' : null}
                        </span>
                    ))}
                </div>
            }
            onClose={closeBanner}
        />
    ) : null;
}
