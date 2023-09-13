import cn from 'bem-cn-lite';

import type {IResponseError} from '../../../../types/api/error';
import type {IIssuesTree} from '../../../../types/store/healthcheck';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import IssueTree from './IssuesViewer/IssueTree';

import i18n from './i18n';

const b = cn('healthcheck');

interface HealthcheckDetailsProps {
    issueTrees?: IIssuesTree[];
    error?: IResponseError;
}

export function HealthcheckDetails(props: HealthcheckDetailsProps) {
    const {issueTrees, error} = props;

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
            <div className={b('details-content-wrapper')}>{renderContent()}</div>
        </div>
    );
}
