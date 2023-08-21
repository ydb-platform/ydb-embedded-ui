import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import type {IResponseError} from '../../../../../types/api/error';
import type {IIssuesTree} from '../../../../../types/store/healthcheck';

import IssueTree from '../IssuesViewer/IssueTree';

import i18n from '../i18n';

const b = cn('healthcheck');

interface DetailsProps {
    issueTrees?: IIssuesTree[];
    loading?: boolean;
    onUpdate: VoidFunction;
    error?: IResponseError;
}

export const Details = (props: DetailsProps) => {
    const {loading, onUpdate, issueTrees, error} = props;

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

    const renderContent = () => {
        if (error) {
            return <div className={b('error')}>{error.statusText || i18n('no-data')}</div>;
        }

        if (!issueTrees || !issueTrees.length) {
            return i18n('status_message.ok');
        }

        return (
            <div className={b('issues-wrapper')}>
                {issueTrees.map((issueTree) => (
                    <IssueTree key={issueTree.id} issueTree={issueTree} />
                ))}
            </div>
        );
    };

    return (
        <div className={b('details')}>
            {renderHealthcheckHeader()}
            {renderContent()}
        </div>
    );
};
