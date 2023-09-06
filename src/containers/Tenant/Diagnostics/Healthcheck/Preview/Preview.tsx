import cn from 'bem-cn-lite';

import {Button, Icon, Link} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import {SelfCheckResult, type StatusFlag} from '../../../../../types/api/healthcheck';
import type {IResponseError} from '../../../../../types/api/error';
import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';
import EntityStatus from '../../../../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../../../../components/Errors/ResponseError';

import i18n from '../i18n';

const b = cn('healthcheck');

interface PreviewProps {
    selfCheckResult: SelfCheckResult;
    issuesStatistics?: [StatusFlag, number][];
    loading?: boolean;
    onShowMore?: VoidFunction;
    onUpdate: VoidFunction;
    error?: IResponseError;
    active?: boolean;
}

export const Preview = (props: PreviewProps) => {
    const {selfCheckResult, issuesStatistics, loading, onShowMore, onUpdate, error, active} = props;

    const isStatusOK = selfCheckResult === SelfCheckResult.GOOD;

    const renderHeader = () => {
        const modifier = selfCheckResult.toLowerCase();

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

        return (
            <div className={b('preview-content')}>
                {isStatusOK || !issuesStatistics || !issuesStatistics.length ? (
                    i18n('status_message.ok')
                ) : (
                    <>
                        <div>{i18n('label.issues')}</div>
                        <div className={b('issues-statistics')}>
                            {issuesStatistics.map(([status, count]) => (
                                <EntityStatus
                                    key={status}
                                    mode="icons"
                                    status={status}
                                    label={count.toString()}
                                    size="l"
                                />
                            ))}
                        </div>
                        <Link onClick={() => onShowMore?.()}>{i18n('label.show-details')}</Link>
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
};
