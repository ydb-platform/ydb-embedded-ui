import type {AlertProps} from '@gravity-ui/uikit';
import {Alert, Button, Flex, Icon, Skeleton} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {healthcheckApi} from '../../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import {cn} from '../../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {HEALTHCHECK_RESULT_TO_ICON, HEALTHCHECK_RESULT_TO_TEXT} from '../../../constants';
import {useTenantQueryParams} from '../../../useTenantQueryParams';

import i18n from './i18n';

import './HealthcheckPreview.scss';

const b = cn('ydb-healthcheck-preview');

interface HealthcheckPreviewProps {
    database: string;
    active?: boolean;
}

const checkResultToAlertTheme: Record<SelfCheckResult, AlertProps['theme']> = {
    [SelfCheckResult.UNSPECIFIED]: 'normal',
    [SelfCheckResult.GOOD]: 'success',
    [SelfCheckResult.DEGRADED]: 'info',
    [SelfCheckResult.MAINTENANCE_REQUIRED]: 'warning',
    [SelfCheckResult.EMERGENCY]: 'danger',
};

export function HealthcheckPreview(props: HealthcheckPreviewProps) {
    const {database} = props;
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {handleShowHealthcheckChange} = useTenantQueryParams();

    const {
        currentData: data,
        isFetching,
        error,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database},
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const loading = isFetching && data === undefined;

    const selfCheckResult: SelfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;

    const modifier = selfCheckResult.toLowerCase();

    if (loading) {
        return <Skeleton className={b('skeleton')} />;
    }

    const issuesCount = data?.issue_log?.filter((issue) => !issue.reason).length;

    const issuesText = issuesCount ? i18n('description_problems', {count: issuesCount}) : '';

    if (selfCheckResult === 'GOOD' && !issuesCount && !loading) {
        return null;
    }

    const renderAlertMessage = () => {
        if (error) {
            return <ResponseError error={error} defaultMessage={i18n('description_no-data')} />;
        }
        return (
            <Flex
                gap={1}
                alignItems="center"
                justifyContent={'space-between'}
                className={b('alert-message')}
            >
                <Flex gap={1} alignItems="center">
                    {HEALTHCHECK_RESULT_TO_TEXT[selfCheckResult]}
                    {issuesText ? ` ${issuesText}` : ''}
                </Flex>
                {issuesCount && (
                    <Button
                        onClick={() => {
                            handleShowHealthcheckChange(true);
                        }}
                    >
                        {i18n('action_review-issues')}
                    </Button>
                )}
            </Flex>
        );
    };

    return (
        <Alert
            className={b()}
            theme={checkResultToAlertTheme[selfCheckResult]}
            view={error ? 'outlined' : 'filled'}
            message={renderAlertMessage()}
            icon={
                <Icon
                    size={18}
                    data={HEALTHCHECK_RESULT_TO_ICON[selfCheckResult]}
                    className={b('icon', {[modifier]: true})}
                />
            }
        />
    );
}
