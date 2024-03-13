import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import {SelfCheckResult, type StatusFlag} from '../../../../../types/api/healthcheck';
import type {IResponseError} from '../../../../../types/api/error';
import {hcStatusToColorFlag} from '../../../../../store/reducers/healthcheckInfo/utils';
import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';
import {EntityStatus} from '../../../../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Loader} from '../../../../../components/Loader';

import i18n from './i18n';
import './Healthcheck.scss';

const b = cn('healthcheck');

interface HealthcheckPreviewProps {
    selfCheckResult: SelfCheckResult;
    issuesStatistics?: [StatusFlag, number][];
    loading?: boolean;
    wasLoaded?: boolean;
    onUpdate: VoidFunction;
    error?: IResponseError;
    active?: boolean;
}

export function HealthcheckPreview(props: HealthcheckPreviewProps) {
    const {selfCheckResult, issuesStatistics, loading, wasLoaded, onUpdate, error, active} = props;

    const renderHeader = () => {
        const modifier = selfCheckResult.toLowerCase();

        if (loading && !wasLoaded) {
            return null;
        }

        return (
            <div className={b('preview-header')}>
                <div className={b('preview-title-wrapper')}>
                    <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                    <Button size="s" onClick={onUpdate} loading={loading} view="flat-secondary">
                        <Icon data={updateArrow} width={20} height={20} />
                    </Button>
                </div>
                <div className={b('self-check-status-indicator', {[modifier]: true})}>
                    {selfCheckResult}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} defaultMessage={i18n('no-data')} />;
        }

        if (loading && !wasLoaded) {
            return <Loader size="m" />;
        }

        return (
            <div className={b('preview-content')}>
                {!issuesStatistics || !issuesStatistics.length ? (
                    i18n('status_message.ok')
                ) : (
                    <>
                        <div>{i18n('label.issues')}</div>
                        <div className={b('issues-statistics')}>
                            {issuesStatistics.map(([status, count]) => (
                                <EntityStatus
                                    key={status}
                                    mode="icons"
                                    status={hcStatusToColorFlag[status]}
                                    label={count.toString()}
                                    size="l"
                                />
                            ))}
                        </div>
                    </>
                )}
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
