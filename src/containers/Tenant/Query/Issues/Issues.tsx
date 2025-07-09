import React from 'react';

import {
    CircleExclamationFill,
    CircleInfoFill,
    CircleXmarkFill,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {ArrowToggle, Button, Icon, Link} from '@gravity-ui/uikit';

import ShortyString from '../../../../components/ShortyString/ShortyString';
import type {ErrorResponse, IssueMessage} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {isNumeric} from '../../../../utils/utils';

import type {SEVERITY} from './models';
import {getSeverity} from './models';

import './Issues.scss';

const blockWrapper = cn('kv-result-issues');
const blockIssues = cn('kv-issues');
const blockIssue = cn('kv-issue');

interface ResultIssuesProps {
    data: ErrorResponse | string;
    hideSeverity?: boolean;
}

export function ResultIssues({data, hideSeverity}: ResultIssuesProps) {
    const [showIssues, setShowIssues] = React.useState(false);

    const issues = typeof data === 'string' ? undefined : data?.issues;
    const hasIssues = Array.isArray(issues) && issues.length > 0;

    const renderTitle = () => {
        let content;
        if (typeof data === 'string') {
            content = data;
        } else {
            const severity = getSeverity(data?.error?.severity);
            content = (
                <React.Fragment>
                    {hideSeverity ? null : (
                        <React.Fragment>
                            <IssueSeverity severity={severity} />{' '}
                        </React.Fragment>
                    )}
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
            {hasIssues && showIssues && <Issues hideSeverity={hideSeverity} issues={issues} />}
        </div>
    );
}

interface IssuesProps {
    issues: IssueMessage[] | null | undefined;
    hideSeverity?: boolean;
}
export function Issues({issues, hideSeverity}: IssuesProps) {
    const mostSevereIssue = issues?.reduce((result, issue) => {
        const severity = issue.severity ?? 10;
        return Math.min(result, severity);
    }, 10);
    return (
        <div className={blockIssues(null)}>
            {issues?.map((issue, index) => (
                <Issue
                    key={index}
                    hideSeverity={hideSeverity}
                    issue={issue}
                    expanded={issue === mostSevereIssue}
                />
            ))}
        </div>
    );
}

function Issue({
    issue,
    hideSeverity,
    level = 0,
}: {
    issue: IssueMessage;
    expanded?: boolean;
    hideSeverity?: boolean;
    level?: number;
}) {
    const [isExpand, setIsExpand] = React.useState(true);
    const severity = getSeverity(issue.severity);

    const issues = issue.issues;
    const hasIssues = Array.isArray(issues) && issues.length > 0;

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
                {hideSeverity ? null : <IssueSeverity severity={severity} />}
                <IssueText issue={issue} />
                {issue.issue_code ? (
                    <span className={blockIssue('code')}>Code: {issue.issue_code}</span>
                ) : null}
            </div>
            {hasIssues && isExpand && (
                <div className={blockIssue('issues')}>
                    <IssueList issues={issues} level={level + 1} expanded={isExpand} />
                </div>
            )}
        </div>
    );
}

interface IssueTextProps {
    issue: IssueMessage;
}

function IssueText({issue}: IssueTextProps) {
    const position = getIssuePosition(issue);

    const ydbEditor = window.ydbEditor;

    const getIssue = () => {
        return (
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
        );
    };

    const {row, column} = issue.position ?? {};
    const isIssueClickable = isNumeric(row) && ydbEditor;
    if (!isIssueClickable) {
        return getIssue();
    }

    const onIssueClickHandler = () => {
        const monacoPosition = {lineNumber: row, column: column ?? 0};

        ydbEditor.setPosition(monacoPosition);
        ydbEditor.revealPositionInCenterIfOutsideViewport(monacoPosition);
        ydbEditor.focus();
    };

    return (
        <Link href="#" onClick={onIssueClickHandler} view="primary" draggable={false}>
            {getIssue()}
        </Link>
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

const severityIcons: Record<SEVERITY, IconData> = {
    S_INFO: CircleInfoFill,
    S_WARNING: CircleExclamationFill,
    S_ERROR: TriangleExclamationFill,
    S_FATAL: CircleXmarkFill,
};
const blockIssueSeverity = cn('yql-issue-severity');
function IssueSeverity({severity}: {severity: SEVERITY}) {
    const shortenSeverity = severity.slice(2).toLowerCase();
    return (
        <span className={blockIssueSeverity({severity: shortenSeverity})}>
            <Icon className={blockIssueSeverity('icon')} data={severityIcons[severity]} />
            <span className={blockIssueSeverity('title')}>{shortenSeverity}</span>
        </span>
    );
}

function getIssuePosition(issue: IssueMessage): string {
    const {position} = issue;
    if (typeof position !== 'object' || position === null || !isNumeric(position.row)) {
        return '';
    }

    const {row, column} = position;

    return isNumeric(column) ? `${row}:${column}` : `line ${row}`;
}
