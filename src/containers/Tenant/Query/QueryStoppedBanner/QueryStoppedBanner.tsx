import React from 'react';

import {Alert} from '@gravity-ui/uikit';

import {cn} from '../../../../utils/cn';
import {QUERY_STOPPED_BANNER_CLOSED_KEY} from '../../../../utils/constants';
import {useSetting} from '../../../../utils/hooks';
import i18n from '../i18n';
const b = cn('ydb-query-stopped-banner');

import './QueryStoppedBanner.scss';

export function QueryStoppedBanner() {
    const [isQueryStoppedBannerClosed, setIsQueryStoppedBannerClosed] = useSetting<boolean>(
        QUERY_STOPPED_BANNER_CLOSED_KEY,
    );

    const closeBanner = React.useCallback(() => {
        setIsQueryStoppedBannerClosed(true);
    }, [setIsQueryStoppedBannerClosed]);

    return isQueryStoppedBannerClosed ? null : (
        <Alert
            className={b()}
            theme="normal"
            align="center"
            style={{paddingTop: 11, paddingBottom: 11}}
            message={<div className={b('message')}>{i18n('banner.query-stopped.message')}</div>}
            layout="horizontal"
            actions={
                <Alert.Actions>
                    <Alert.Action view="normal" onClick={closeBanner}>
                        {i18n('banner.query-stopped.never-show')}
                    </Alert.Action>
                </Alert.Actions>
            }
        />
    );
}
