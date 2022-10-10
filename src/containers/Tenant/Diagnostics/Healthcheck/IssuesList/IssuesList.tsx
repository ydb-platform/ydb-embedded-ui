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
    const {data, loading, onUpdate} = props;

    if (!data) {
        return null;
    }

    const renderHealthcheckHeader = () => {
        return (
            <div className={b('issues-list-header')}>
                <h3 className={b('issues-list-header-title')}>{i18n('title.healthcheck')}</h3>
                <div className={b('issues-list-header-update')}>
                    <Button size="s" onClick={onUpdate} loading={loading} view="flat-secondary">
                        <Icon data={updateArrow} height={20} width={20} />
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
                <IssuesViewer issues={issueLog} />
            </div>
        );
    };

    return (
        <div className={b('issues-list')}>
            {renderHealthcheckHeader()}
            {renderHealthcheckIssues()}
        </div>
    );
};
