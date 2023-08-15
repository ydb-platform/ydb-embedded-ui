import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader} from '@gravity-ui/uikit';

import {SelfCheckResult} from '../../../../types/api/healthcheck';
import {useTypedSelector, useAutofetcher} from '../../../../utils/hooks';
import {
    getHealthcheckInfo,
    selectIssuesTreesByIds,
    setDataWasNotLoaded,
} from '../../../../store/reducers/healthcheckInfo';

import {Details} from './Details';
import {Preview} from './Preview';

import i18n from './i18n';
import './Healthcheck.scss';

interface HealthcheckProps {
    tenant: string;
    preview?: boolean;
    fetchData?: boolean;
    expandedIssueIds?: string[];
    showMoreHandler?: (issueIds: string[]) => void;
}

const b = cn('healthcheck');

export const Healthcheck = (props: HealthcheckProps) => {
    const {tenant, preview, fetchData = true, showMoreHandler, expandedIssueIds} = props;

    const dispatch = useDispatch();

    const {data, loading, wasLoaded, error} = useTypedSelector((state) => state.healthcheckInfo);
    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const issuesTrees = data?.issue_log || [];

    const expandedIssueTrees = useTypedSelector((state) =>
        selectIssuesTreesByIds(state, expandedIssueIds),
    );

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const fetchHealthcheck = useCallback(
        (isBackground = true) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(getHealthcheckInfo(tenant));
        },
        [dispatch, tenant],
    );

    useAutofetcher(
        (isBackground) => {
            if (fetchData) {
                fetchHealthcheck(isBackground);
            }
        },
        [fetchData, fetchHealthcheck],
        autorefresh,
    );

    const renderContent = () => {
        if (error) {
            return error.statusText;
        }

        if (loading && !wasLoaded) {
            return (
                <div className={b('loader')}>
                    <Loader size="m" />
                </div>
            );
        }

        if (data && data['self_check_result']) {
            return preview ? (
                <Preview
                    issuesTrees={issuesTrees}
                    selfCheckResult={selfCheckResult}
                    loading={loading}
                    onShowMore={showMoreHandler}
                    onUpdate={fetchHealthcheck}
                />
            ) : (
                <Details
                    issueTrees={expandedIssueTrees}
                    loading={loading}
                    onUpdate={fetchHealthcheck}
                />
            );
        }

        return <div className="error">{i18n('no-data')}</div>;
    };

    return <div className={b({expanded: !preview})}>{renderContent()}</div>;
};
