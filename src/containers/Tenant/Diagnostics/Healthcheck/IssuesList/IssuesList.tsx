import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import type {IHealthCheck} from '../../../../../types/store/healthcheck';

import IssuesViewer from '../IssuesViewer/IssuesViewer';

import i18n from '../i18n';

const b = cn('healthcheck');

interface IssuesListProps {
    data?: IHealthCheck;
    loading?: boolean;
    onUpdate: VoidFunction;
}

export const IssuesList = (props: IssuesListProps) => {
    const {
        data,
        loading,
        onUpdate,
    } = props;

    if (!data) {
        return null;
    }

    const renderOverviewStatus = () => {
        const {self_check_result: selfCheckResult} = data;
        const modifier = selfCheckResult.toLowerCase();

        return (
            <div className={b('self-check-status')}>
                <h3 className={b('self-check-status-label')}>{i18n('title.self-check-status')}</h3>
                <div className={b('self-check-status-indicator', {[modifier]: true})} />
                {selfCheckResult}
                <div className={b('self-check-update')}>
                    <Button size="s" onClick={onUpdate} loading={loading}>
                        <Icon data={updateArrow} />
                    </Button>
                </div>
            </div>
        );
    };

    const renderHealthcheckIssues = () => {
        const {issue_log: issueLog} = data;

        if (!issueLog) {
            return null;
        }

        return (
            <div className={b('issues')}>
                <h3>{i18n('title.issues')}</h3>
                <IssuesViewer issues={issueLog} />
            </div>
        );
    }

    return (
        <div className={b('issues-list')}>
            {renderOverviewStatus()}
            {renderHealthcheckIssues()}
        </div>
    );
};
