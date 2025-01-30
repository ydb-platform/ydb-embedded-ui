import {
    CircleCheck,
    CircleInfo,
    CircleQuestion,
    CircleXmark,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {Icon, Popover} from '@gravity-ui/uikit';

import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Loader} from '../../../../../components/Loader';
import {useClusterBaseInfo} from '../../../../../store/reducers/cluster/cluster';
import {healthcheckApi} from '../../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import {cn} from '../../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';

import i18n from './i18n';

import CircleExclamationIcon from '@gravity-ui/icons/svgs/circle-exclamation.svg';

import './Healthcheck.scss';

const b = cn('healthcheck');

interface HealthcheckPreviewProps {
    tenantName: string;
    active?: boolean;
}

const icons: Record<SelfCheckResult, IconData> = {
    [SelfCheckResult.UNSPECIFIED]: CircleQuestion,
    [SelfCheckResult.GOOD]: CircleCheck,
    [SelfCheckResult.DEGRADED]: CircleInfo,
    [SelfCheckResult.MAINTENANCE_REQUIRED]: CircleXmark,
    [SelfCheckResult.EMERGENCY]: TriangleExclamationFill,
};

export function HealthcheckPreview(props: HealthcheckPreviewProps) {
    const {tenantName, active} = props;
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {name} = useClusterBaseInfo();
    const healthcheckPreviewAutorefreshDisabled = name === 'ydb_ru';

    const {
        currentData: data,
        isFetching,
        error,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database: tenantName},
        {
            //FIXME https://github.com/ydb-platform/ydb-embedded-ui/issues/1889
            pollingInterval: healthcheckPreviewAutorefreshDisabled
                ? undefined
                : autoRefreshInterval,
        },
    );

    const loading = isFetching && data === undefined;

    const renderHeader = () => {
        return (
            <div className={b('preview-header')}>
                <div className={b('preview-title-wrapper')}>
                    <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                    {/* FIXME https://github.com/ydb-platform/ydb-embedded-ui/issues/1889 */}
                    {autoRefreshInterval && healthcheckPreviewAutorefreshDisabled ? (
                        <Popover
                            content={'Autorefresh is disabled. Please update healthcheck manually.'}
                            placement={['top']}
                            className={b('icon-wrapper')}
                        >
                            {() => (
                                <Icon
                                    size={16}
                                    className={b('icon-warn')}
                                    data={CircleExclamationIcon}
                                />
                            )}
                        </Popover>
                    ) : null}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} defaultMessage={i18n('no-data')} />;
        }

        if (loading) {
            return <Loader size="m" />;
        }

        const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
        const modifier = selfCheckResult.toLowerCase();
        return (
            <div className={b('preview-content')}>
                <div className={b('preview-issue', {[modifier]: true})}>
                    <Icon className={b('preview-status-icon')} data={icons[selfCheckResult]} />
                    <div className={b('self-check-status-indicator')}>
                        {selfCheckResult.replace(/_/g, ' ')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DiagnosticCard className={b('preview')} active={active}>
            {renderHeader()}
            {renderContent()}
        </DiagnosticCard>
    );
}
