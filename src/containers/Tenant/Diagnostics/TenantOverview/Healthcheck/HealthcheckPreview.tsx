import React from 'react';

import type {AlertProps} from '@gravity-ui/uikit';
import {Alert, Button, Flex, Icon, Popover, Skeleton} from '@gravity-ui/uikit';

import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {useClusterBaseInfo} from '../../../../../store/reducers/cluster/cluster';
import {healthcheckApi} from '../../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import {cn} from '../../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';
import {HEALTHCHECK_RESULT_TO_ICON, HEALTHCHECK_RESULT_TO_TEXT} from '../../../constants';
import {useTenantQueryParams} from '../../../useTenantQueryParams';

import i18n from './i18n';

import CircleExclamationIcon from '@gravity-ui/icons/svgs/circle-exclamation.svg';

import './HealthcheckPreview.scss';

const b = cn('ydb-healthcheck-preview');

interface HealthcheckPreviewProps {
    tenantName: string;
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
    const {tenantName} = props;
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {name} = useClusterBaseInfo();

    const {handleShowHealthcheckChange} = useTenantQueryParams();

    const healthcheckPreviewDisabled = name === 'ydb_ru';

    const {
        currentData: data,
        isFetching,
        error,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database: tenantName},
        {
            //FIXME https://github.com/ydb-platform/ydb-embedded-ui/issues/1889
            pollingInterval: healthcheckPreviewDisabled ? undefined : autoRefreshInterval,
            skip: healthcheckPreviewDisabled,
        },
    );

    const [getHealthcheckQuery, {currentData: manualData, isFetching: isFetchingManually}] =
        healthcheckApi.useLazyGetHealthcheckInfoQuery();

    React.useEffect(() => {
        if (healthcheckPreviewDisabled) {
            getHealthcheckQuery({database: tenantName});
        }
    }, [healthcheckPreviewDisabled, tenantName, getHealthcheckQuery]);

    React.useEffect(() => {
        const fetchHealthcheck = () => {
            if (healthcheckPreviewDisabled) {
                getHealthcheckQuery({database: tenantName});
            }
        };
        document.addEventListener('diagnosticsRefresh', fetchHealthcheck);
        return () => {
            document.removeEventListener('diagnosticsRefresh', fetchHealthcheck);
        };
    }, [tenantName, healthcheckPreviewDisabled, getHealthcheckQuery]);

    const loading =
        (isFetching && data === undefined) || (isFetchingManually && manualData === undefined);

    const selfCheckResult: SelfCheckResult =
        data?.self_check_result || manualData?.self_check_result || SelfCheckResult.UNSPECIFIED;

    const modifier = selfCheckResult.toLowerCase();

    if (loading) {
        return <Skeleton className={b('skeleton')} />;
    }

    const issuesCount = data?.issue_log?.filter((issue) => !issue.reason).length;

    const issuesText = issuesCount ? i18n('description_problems', {count: issuesCount}) : '';

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
                    {healthcheckPreviewDisabled ? (
                        <Popover
                            content={'Healthcheck is disabled. Please update healthcheck manually.'}
                            placement={['top']}
                            className={b('icon-wrapper')}
                        >
                            {() => <Icon size={16} data={CircleExclamationIcon} />}
                        </Popover>
                    ) : null}
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
