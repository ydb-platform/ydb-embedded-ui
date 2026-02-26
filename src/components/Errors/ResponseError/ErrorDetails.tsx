import React from 'react';

import {Button} from '@gravity-ui/uikit';

import type {ErrorResponse} from '../../../types/api/query';
import {cn} from '../../../utils/cn';
import type {ErrorDetails as ErrorDetailsData} from '../../../utils/errors/extractErrorDetails';
import {isResponseError, isResponseErrorWithIssues} from '../../../utils/response';
import {ClipboardButton} from '../../ClipboardButton/ClipboardButton';
import {ResultIssues} from '../../ResultIssues/ResultIssues';
import i18n from '../i18n';

const b = cn('ydb-response-error');

interface ErrorDetailsProps {
    details: ErrorDetailsData;
    error: unknown;
}

export function ErrorDetails({details, error}: ErrorDetailsProps) {
    const [expanded, setExpanded] = React.useState(false);

    const toggleLabel = expanded ? i18n('action_hide-details') : i18n('action_show-details');

    const issuesData = getIssuesData(error);

    return (
        <div className={b('details')}>
            <Button view="flat-secondary" size="s" onClick={() => setExpanded(!expanded)}>
                {toggleLabel}
            </Button>
            {expanded && (
                <div className={b('details-content')}>
                    {details.status && (
                        <DetailRow
                            label="Status"
                            value={`${details.status} ${details.statusText || ''}`}
                        />
                    )}
                    {details.traceId && (
                        <DetailRow label="Trace ID" value={details.traceId} copyable />
                    )}
                    {details.requestUrl && (
                        <DetailRow
                            label="Request"
                            value={`${details.method || 'GET'} ${details.requestUrl}`}
                        />
                    )}
                    {details.errorCode && (
                        <DetailRow label="Error code" value={details.errorCode} />
                    )}
                    {issuesData && (
                        <div className={b('details-issues')}>
                            <ResultIssues data={issuesData} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DetailRow({label, value, copyable}: {label: string; value: string; copyable?: boolean}) {
    return (
        <div className={b('detail-row')}>
            <span className={b('detail-label')}>{label}:</span>
            <span className={b('detail-value')}>{value}</span>
            {copyable && <ClipboardButton copyText={value} size="xs" withLabel={false} />}
        </div>
    );
}

function getIssuesData(error: unknown): ErrorResponse | undefined {
    if (!isResponseError(error) || !isResponseErrorWithIssues(error)) {
        return undefined;
    }
    return error.data as ErrorResponse;
}
