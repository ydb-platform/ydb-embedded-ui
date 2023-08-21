import cn from 'bem-cn-lite';

import {Button, Icon, Link} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import {SelfCheckResult, type StatusFlag} from '../../../../../types/api/healthcheck';
import type {IResponseError} from '../../../../../types/api/error';
import {DiagnosticCard} from '../../../../../components/DiagnosticCard/DiagnosticCard';
import EntityStatus from '../../../../../components/EntityStatus/EntityStatus';

import i18n from '../i18n';

const b = cn('healthcheck');

interface PreviewProps {
    selfCheckResult: SelfCheckResult;
    issuesStatistics?: [StatusFlag, number][];
    loading?: boolean;
    onShowMore?: VoidFunction;
    onUpdate: VoidFunction;
    error?: IResponseError;
}

export const Preview = (props: PreviewProps) => {
    const {selfCheckResult, issuesStatistics, loading, onShowMore, onUpdate, error} = props;

    const isStatusOK = selfCheckResult === SelfCheckResult.GOOD;

    if (!issuesStatistics) {
        return null;
    }
    const renderStatus = () => {
        const modifier = selfCheckResult.toLowerCase();

        return (
            <div className={b('status-wrapper')}>
                <div className={b('preview-title')}>{i18n('title.healthcheck')}</div>
                <div className={b('self-check-status-indicator', {[modifier]: true})}>
                    {selfCheckResult}
                </div>
                <Button size="s" onClick={onUpdate} loading={loading} view="flat-secondary">
                    <Icon data={updateArrow} width={20} height={20} />
                </Button>
            </div>
        );
    };

    const renderContent = () => {
        if (error) {
            return <div className={b('error')}>{error.statusText || i18n('no-data')}</div>;
        }

        return (
            <div className={b('preview-content')}>
                {isStatusOK ? (
                    i18n('status_message.ok')
                ) : (
                    <>
                        <div>Issues:</div>
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
        <DiagnosticCard className={b('preview')}>
            {renderStatus()}
            {renderContent()}
        </DiagnosticCard>
    );
};
