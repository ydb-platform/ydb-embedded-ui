import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import type {IIssuesTree} from '../../../../../types/store/healthcheck';

import IssueTree from '../IssuesViewer/IssueTree';

import i18n from '../i18n';

const b = cn('healthcheck');

interface DetailsProps {
    issueTree?: IIssuesTree;
    loading?: boolean;
    onUpdate: VoidFunction;
}

export const Details = (props: DetailsProps) => {
    const {loading, onUpdate, issueTree} = props;

    if (!issueTree) {
        return null;
    }

    const renderHealthcheckHeader = () => {
        return (
            <div className={b('details-header')}>
                <h3 className={b('details-header-title')}>{i18n('title.healthcheck')}</h3>
                <div className={b('details-header-update')}>
                    <Button size="s" onClick={onUpdate} loading={loading} view="flat-secondary">
                        <Icon data={updateArrow} height={20} width={20} />
                    </Button>
                </div>
            </div>
        );
    };

    const renderHealthcheckIssues = () => {
        return (
            <div className={b('issues-wrapper')}>
                <IssueTree issueTree={issueTree} />
            </div>
        );
    };

    return (
        <div className={b('details')}>
            {renderHealthcheckHeader()}
            {renderHealthcheckIssues()}
        </div>
    );
};
