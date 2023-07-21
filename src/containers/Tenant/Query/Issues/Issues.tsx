import * as React from 'react';
import cn from 'bem-cn-lite';

import {Button, Icon, ArrowToggle} from '@gravity-ui/uikit';
import ShortyString from '../../../../components/ShortyString/ShortyString';

import type {ErrorResponse, IssueMessage} from '../../../../types/api/query';

import fatalIcon from '../../../../assets/icons/circle-xmark.svg';
import errorIcon from '../../../../assets/icons/triangle-exclamation.svg';
import warningIcon from '../../../../assets/icons/circle-exclamation.svg';
import infoIcon from '../../../../assets/icons/circle-info.svg';

import {SEVERITY, getSeverity} from './models';

import './Issues.scss';

const blockWrapper = cn('kv-result-issues');
const blockIssues = cn('kv-issues');
const blockIssue = cn('kv-issue');

interface ResultIssuesProps {
    data: ErrorResponse | string;
    className: string;
}

export default function ResultIssues({data, className}: ResultIssuesProps) {
    const [showIssues, setShowIssues] = React.useState(false);

    const hasIssues = typeof data === 'string' ? false : Array.isArray(data?.issues);

    const renderTitle = () => {
        let content;
        if (typeof data === 'string') {
            content = data;
        } else {
            const severity = getSeverity(data?.error?.severity);
            content = (
                <React.Fragment>
                    <IssueSeverity severity={severity} />{' '}
                    <span className={blockWrapper('error-message-text')}>
                        {data?.error?.message}
                    </span>
                </React.Fragment>
            );
        }

        return content;
    };

    return (
        <div className={blockWrapper()}>
            <div className={blockWrapper('error-message')}>
                {renderTitle()}
                {hasIssues && (
                    <Button view="normal" onClick={() => setShowIssues(!showIssues)}>
                        {showIssues ? 'Hide details' : 'Show details'}
                    </Button>
                )}
            </div>
            {hasIssues && showIssues && (
                <Issues issues={(data as ErrorResponse)?.issues} className={className} />
            )}
        </div>
    );
}

interface IssuesProps {
    className?: string;
    issues: IssueMessage[] | null | undefined;
}
export function Issues({issues, className}: IssuesProps) {
    const mostSevereIssue = issues?.reduce((result, issue) => {
        const severity = issue.severity ?? 10;
        return Math.min(result, severity);
    }, 10);
    return (
        <div className={blockIssues(null, className)}>
            {issues?.map((issue, index) => (
                <Issue key={index} issue={issue} expanded={issue === mostSevereIssue} />
            ))}
        </div>
    );
}

function Issue({issue, level = 0}: {issue: IssueMessage; expanded?: boolean; level?: number}) {
    const [isExpand, setIsExpand] = React.useState(true);
    const severity = getSeverity(issue.severity);
    const hasIssues = Array.isArray(issue.issues) && issue.issues.length > 0;
    const position = getIssuePosition(issue);

    const arrowDirection = isExpand ? 'bottom' : 'right';

    return (
        <div
            className={blockIssue({
                leaf: !hasIssues,
                'has-issues': hasIssues,
            })}
        >
            <div className={blockIssue('line')}>
                {hasIssues && (
                    <Button
                        view="flat-secondary"
                        onClick={() => setIsExpand(!isExpand)}
                        className={blockIssue('arrow-toggle')}
                    >
                        <ArrowToggle direction={arrowDirection} size={16} />
                    </Button>
                )}
                <IssueSeverity severity={severity} />

                <span className={blockIssue('message')}>
                    {position && (
                        <span className={blockIssue('place-text')} title="Position">
                            {position}
                        </span>
                    )}
                    <div className={blockIssue('message-text')}>
                        <ShortyString value={issue.message} expandLabel={'Show full message'} />
                    </div>
                </span>
                {issue.issue_code ? (
                    <span className={blockIssue('code')}>Code: {issue.issue_code}</span>
                ) : null}
            </div>
            {hasIssues && isExpand && (
                <div className={blockIssue('issues')}>
                    <IssueList
                        issues={issue.issues as IssueMessage[]}
                        level={level + 1}
                        expanded={isExpand}
                    />
                </div>
            )}
        </div>
    );
}

function IssueList(props: {issues: IssueMessage[]; expanded: boolean; level: number}) {
    const {issues, level, expanded} = props;
    return (
        <div className={blockIssue('list')}>
            {issues.map((issue, index) => (
                <Issue key={index} issue={issue} level={level} expanded={expanded} />
            ))}
        </div>
    );
}

const severityIcons: Record<SEVERITY, string> = {
    S_INFO: infoIcon,
    S_WARNING: warningIcon,
    S_ERROR: errorIcon,
    S_FATAL: fatalIcon,
};
const blockIssueSeverity = cn('yql-issue-severity');
function IssueSeverity({severity}: {severity: SEVERITY}) {
    const shortenSeverity = severity.slice(2).toLowerCase();
    return (
        <span className={blockIssueSeverity({severity: shortenSeverity})}>
            <Icon className={blockIssueSeverity('icon')} data={severityIcons[severity]} size={16} />
            <span className={blockIssueSeverity('title')}>{shortenSeverity}</span>
        </span>
    );
}

function getIssuePosition(issue: IssueMessage) {
    const {position = {}} = issue;

    if (!position) {
        return false;
    }

    const {file, row, column} = position;

    return `${file ? 'file:' : ''}${row}:${column}`;
}
