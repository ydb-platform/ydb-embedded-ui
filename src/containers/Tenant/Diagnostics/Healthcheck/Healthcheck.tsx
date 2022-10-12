import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader} from '@gravity-ui/uikit';

import {getHealthcheckInfo} from '../../../../store/reducers/healthcheckInfo';
import {useAutofetcher} from '../../../../utils/hooks';

import {IssuesList} from './IssuesList';
import {Preview} from './Preview';

import i18n from './i18n';
import './Healthcheck.scss';

interface HealthcheckProps {
    tenant: string;
    preview?: boolean;
    fetchData?: boolean;
    expandedIssueId?: string;
    showMoreHandler?: (id: string) => void;
}

const b = cn('healthcheck');

export const Healthcheck = (props: HealthcheckProps) => {
    const {tenant, preview, fetchData = true, showMoreHandler, expandedIssueId} = props;

    const dispatch = useDispatch();

    const {data, loading, wasLoaded, error} = useSelector((state: any) => state.healthcheckInfo);
    const {autorefresh} = useSelector((state: any) => state.schema);

    const fetchHealthcheck = useCallback(() => {
        if (fetchData) {
            dispatch(getHealthcheckInfo(tenant));
        }
    }, [dispatch, fetchData, tenant]);

    useAutofetcher(fetchHealthcheck, [fetchHealthcheck], autorefresh);

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
                    data={data}
                    loading={loading}
                    onShowMore={showMoreHandler}
                    onUpdate={fetchHealthcheck}
                />
            ) : (
                <IssuesList
                    data={data}
                    expandedIssueId={expandedIssueId}
                    loading={loading}
                    onUpdate={fetchHealthcheck}
                />
            );
        }

        return <div className="error">{i18n('no-data')}</div>;
    };

    return <div className={b()}>{renderContent()}</div>;
};
