import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader} from '@gravity-ui/uikit';

import {SelfCheckResult} from '../../../../types/api/healthcheck';
import {useTypedSelector, useAutofetcher} from '../../../../utils/hooks';
import {
    getHealthcheckInfo,
    selectIssuesStatistics,
    selectIssuesTrees,
    setDataWasNotLoaded,
} from '../../../../store/reducers/healthcheckInfo';
import {DiagnosticCard} from '../../../../components/DiagnosticCard/DiagnosticCard';

import {Details} from './Details';
import {Preview} from './Preview';

import './Healthcheck.scss';

interface HealthcheckProps {
    tenant: string;
    preview?: boolean;
    fetchData?: boolean;
    showMoreHandler?: VoidFunction;
    selected?: boolean;
}

const b = cn('healthcheck');

export const Healthcheck = (props: HealthcheckProps) => {
    const {tenant, preview, fetchData = true, showMoreHandler, selected} = props;

    const dispatch = useDispatch();

    const {data, loading, wasLoaded, error} = useTypedSelector((state) => state.healthcheckInfo);
    const issuesStatistics = useTypedSelector(selectIssuesStatistics);
    const issueTrees = useTypedSelector(selectIssuesTrees);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;

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
        if (loading && !wasLoaded) {
            return (
                <DiagnosticCard className={b('loader')}>
                    <Loader size="m" />
                </DiagnosticCard>
            );
        }
        return preview ? (
            <Preview
                issuesStatistics={issuesStatistics}
                selfCheckResult={selfCheckResult}
                loading={loading}
                onShowMore={showMoreHandler}
                onUpdate={fetchHealthcheck}
                error={error}
                selected={selected}
            />
        ) : (
            <Details
                loading={loading}
                onUpdate={fetchHealthcheck}
                issueTrees={issueTrees}
                error={error}
            />
        );
    };

    return <div className={b({expanded: !preview})}>{renderContent()}</div>;
};
