import {useMemo} from 'react';
import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import {SelfCheckResult} from '../../../../../types/api/healthcheck';
import type {IHealthCheck} from '../../../../../types/store/healthcheck';

import {IssuePreview} from '../IssuePreview';

import i18n from '../i18n';

const b = cn('healthcheck');

interface PreviewProps {
    data?: IHealthCheck;
    loading?: boolean;
    onShowMore?: VoidFunction;
    onUpdate: VoidFunction;
}

export const Preview = (props: PreviewProps) => {
    const {data, loading, onShowMore, onUpdate} = props;

    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const isStatusOK = selfCheckResult === SelfCheckResult.GOOD;

    const issuesLog = data?.issue_log;
    const firstLevelIssues = useMemo(
        () => issuesLog?.filter(({level}) => level === 1),
        [issuesLog],
    );

    if (!data) {
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

    const renderFirstLevelIssues = () => {
        return (
            <div className={b('preview-content')}>
                {isStatusOK
                    ? i18n('status_message.ok')
                    : firstLevelIssues?.map((issue) => (
                          <IssuePreview key={issue.id} data={issue} onShowMore={onShowMore} />
                      ))}
            </div>
        );
    };

    return (
        <div className={b('preview')}>
            {renderStatus()}
            {renderFirstLevelIssues()}
        </div>
    );
};
