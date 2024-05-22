import {
    ArrowsRotateRight,
    CircleCheck,
    CircleInfo,
    CircleQuestion,
    CircleXmark,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {Button, Icon} from '@gravity-ui/uikit';

import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Loader} from '../../../../../components/Loader';
import {healthcheckApi} from '../../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import {cn} from '../../../../../utils/cn';
import {useTypedSelector} from '../../../../../utils/hooks';

import i18n from './i18n';

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
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const {
        currentData: data,
        isFetching,
        error,
        refetch,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database: tenantName, maxLevel: 1},
        {
            pollingInterval: autorefresh,
        },
    );

    const loading = isFetching && data === undefined;

    const renderHeader = () => {
        return (
            <div className={b('preview-header')}>
                <div className={b('preview-title-wrapper')}>
                    <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                    <Button
                        size="s"
                        onClick={(event) => {
                            // FIXME: refactor card to remove the button from the anchor link.
                            event.preventDefault();
                            refetch();
                        }}
                        loading={isFetching}
                        view="flat-secondary"
                    >
                        <Icon data={ArrowsRotateRight} size={20} />
                    </Button>
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
