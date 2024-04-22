import React from 'react';

import {ResponseError} from '../../../../../components/Errors/ResponseError';
import {Loader} from '../../../../../components/Loader';
import type {IssuesTree} from '../../../../../store/reducers/healthcheckInfo/types';
import {cn} from '../../../../../utils/cn';

import IssueTree from './IssuesViewer/IssueTree';
import i18n from './i18n';

import './Healthcheck.scss';

const b = cn('healthcheck');

interface HealthcheckDetailsProps {
    issueTrees?: IssuesTree[];
    loading?: boolean;
    error?: unknown;
}

export function HealthcheckDetails(props: HealthcheckDetailsProps) {
    const {issueTrees, loading, error} = props;

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
