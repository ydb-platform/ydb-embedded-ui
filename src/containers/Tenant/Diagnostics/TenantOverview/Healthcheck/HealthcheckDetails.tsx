import cn from 'bem-cn-lite';

import type {IResponseError} from '../../../../../types/api/error';
import type {IssuesTree} from '../../../../../store/reducers/healthcheckInfo/types';
import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Loader} from '../../../../../components/Loader';

import IssueTree from './IssuesViewer/IssueTree';

import i18n from './i18n';
import './Healthcheck.scss';

const b = cn('healthcheck');

interface HealthcheckDetailsProps {
    issueTrees?: IssuesTree[];
    loading?: boolean;
    wasLoaded?: boolean;
    error?: IResponseError;
}

export function HealthcheckDetails(props: HealthcheckDetailsProps) {
    const {issueTrees, loading, wasLoaded, error} = props;

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} defaultMessage={i18n('no-data')} />;
        }

        if (loading && !wasLoaded) {
            return <Loader size="m" />;
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
