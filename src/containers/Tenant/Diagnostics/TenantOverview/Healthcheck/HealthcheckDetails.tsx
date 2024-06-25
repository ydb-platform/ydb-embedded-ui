import React from 'react';

import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Loader} from '../../../../../components/Loader';
import {selectAutoRefreshInterval} from '../../../../../store/reducers/autoRefreshControl';
import {cn} from '../../../../../utils/cn';
import {useTypedSelector} from '../../../../../utils/hooks';
import {useHealthcheck} from '../useHealthcheck';

import IssueTree from './IssuesViewer/IssueTree';
import i18n from './i18n';

import './Healthcheck.scss';

const b = cn('healthcheck');

interface HealthcheckDetailsProps {
    tenantName: string;
}

export function HealthcheckDetails({tenantName}: HealthcheckDetailsProps) {
    const autoRefreshInterval = useTypedSelector(selectAutoRefreshInterval);
    const {issueTrees, loading, error} = useHealthcheck(tenantName, {
        autorefresh: autoRefreshInterval,
    });

    const renderContent = () => {
        if (error) {
            return <ResponseError error={error} defaultMessage={i18n('no-data')} />;
        }

        if (loading) {
            return <Loader size="m" />;
        }

        if (!issueTrees || !issueTrees.length) {
            return i18n('status_message.ok');
        }

        return (
            <React.Fragment>
                {issueTrees.map((issueTree) => (
                    <IssueTree key={issueTree.id} issueTree={issueTree} />
                ))}
            </React.Fragment>
        );
    };

    return (
        <div className={b('details')}>
            <div className={b('details-content-wrapper')}>{renderContent()}</div>
        </div>
    );
}
