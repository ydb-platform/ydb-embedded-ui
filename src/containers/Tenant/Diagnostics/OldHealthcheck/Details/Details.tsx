import cn from 'bem-cn-lite';

import {Button, Icon} from '@gravity-ui/uikit';

import updateArrow from '../../../../../assets/icons/update-arrow.svg';

import type {IResponseError} from '../../../../../types/api/error';
import type {IIssuesTree} from '../../../../../types/store/healthcheck';
import {ResponseError} from '../../../../../components/Errors/ResponseError';

import IssueTree from '../../TenantOverview/Healthcheck/IssuesViewer/IssueTree';

import i18n from '../../TenantOverview/Healthcheck/i18n';

const b = cn('old-healthcheck');

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
            return <ResponseError error={error} defaultMessage={i18n('no-data')} />;
        }

        if (!issueTrees || !issueTrees.length) {
            return i18n('status_message.ok');
        }

        return (
            <>
                {issueTrees.map((issueTree) => (
                    <IssueTree key={issueTree.id} issueTree={issueTree} />
                ))}
            </>
        );
    };

    return (
        <div className={b('details')}>
            {renderHealthcheckHeader()}
            <div className={b('details-content-wrapper')}>{renderContent()}</div>
        </div>
    );
};
