import React from 'react';

import {ArrowsRotateRight} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';
import {EntityStatus} from '../../../../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Loader} from '../../../../../components/Loader';
import {hcStatusToColorFlag} from '../../../../../store/reducers/healthcheckInfo/utils';
import type {SelfCheckResult, StatusFlag} from '../../../../../types/api/healthcheck';
import {cn} from '../../../../../utils/cn';

import i18n from './i18n';

import './Healthcheck.scss';

const b = cn('healthcheck');

interface HealthcheckPreviewProps {
    selfCheckResult: SelfCheckResult;
    issuesStatistics?: [StatusFlag, number][];
    loading?: boolean;
    onUpdate: VoidFunction;
    error?: unknown;
    active?: boolean;
}

export function HealthcheckPreview(props: HealthcheckPreviewProps) {
    const {selfCheckResult, issuesStatistics, loading, onUpdate, error, active} = props;

    const renderHeader = () => {
        const modifier = selfCheckResult.toLowerCase();

        if (loading) {
            return null;
        }

        return (
            <div className={b('preview-header')}>
                <div className={b('preview-title-wrapper')}>
                    <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                    <Button
                        size="s"
                        onClick={(event) => {
                            // FIXME: refactor card to remove the button from the anchor link.
                            event.preventDefault();
                            onUpdate();
                        }}
                        loading={loading}
                        view="flat-secondary"
                    >
                        <Icon data={ArrowsRotateRight} size={20} />
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

        if (loading) {
            return <Loader size="m" />;
        }

        return (
            <div className={b('preview-content')}>
                {!issuesStatistics || !issuesStatistics.length ? (
                    i18n('status_message.ok')
                ) : (
                    <React.Fragment>
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
                    </React.Fragment>
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
