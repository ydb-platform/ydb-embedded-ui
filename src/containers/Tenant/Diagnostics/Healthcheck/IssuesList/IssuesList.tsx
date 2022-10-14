import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import type {IIssuesTree} from '../../../../../types/store/healthcheck';

import IssuesViewer from '../IssuesViewer/IssuesViewer';

import i18n from '../i18n';

const b = cn('healthcheck');

interface IssuesListProps {
    issue?: IIssuesTree;
    loading?: boolean;
    onUpdate: VoidFunction;
}

export const IssuesList = (props: IssuesListProps) => {
    const {loading, onUpdate, issue} = props;

    if (!issue) {
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
        return (
            <div className={b('issues')}>
                <IssuesViewer issue={issue} />
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
