import React from 'react';

import {ArrowToggle, Button, Link} from '@gravity-ui/uikit';

import type {IssueMessage} from '../../types/api/query';
import {cn} from '../../utils/cn';
import {isNumeric} from '../../utils/utils';
import ShortyString from '../ShortyString/ShortyString';

import {IssueSeverity} from './IssueSeverity';
import {getIssuePosition, getMostSevere, hasRootIssues} from './helpers';
import i18n from './i18n';
import {getSeverity} from './models';

const blockIssues = cn('kv-issues');
const blockIssue = cn('kv-issue');

interface IssuesProps {
    issues: IssueMessage[] | null | undefined;
    hideSeverity?: boolean;
}

export function Issues({issues, hideSeverity}: IssuesProps) {
    const mostSevereIssue = getMostSevere(issues);
    return (
        <div className={blockIssues(null)}>
            {issues?.map((issue, index) => (
                <Issue
                    key={index}
                    hideSeverity={hideSeverity}
                    issue={issue}
                    expanded={issue.severity === mostSevereIssue}
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
    const hasIssues = hasRootIssues(issues);

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
                    <span className={blockIssue('code')}>
                        {i18n('field_code')}: {issue.issue_code}
                    </span>
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

function IssueText({issue}: {issue: IssueMessage}) {
    const position = getIssuePosition(issue);
    const ydbEditor = window.ydbEditor;

    const issueContent = (
        <span className={blockIssue('message')}>
            {position && (
                <span className={blockIssue('place-text')} title={i18n('field_position')}>
                    {position}
                </span>
            )}
            <div className={blockIssue('message-text')}>
                <ShortyString
                    value={issue.message}
                    expandLabel={i18n('action_show-full-message')}
                />
            </div>
        </span>
    );

    const {row, column} = issue.position ?? {};
    const isIssueClickable = isNumeric(row) && ydbEditor;
    if (!isIssueClickable) {
        return issueContent;
    }

    const onIssueClickHandler = () => {
        const monacoPosition = {lineNumber: row, column: column ?? 0};
        ydbEditor.setPosition(monacoPosition);
        ydbEditor.revealPositionInCenterIfOutsideViewport(monacoPosition);
        ydbEditor.focus();
    };

    return (
        <Link href="#" onClick={onIssueClickHandler} view="primary" draggable={false}>
            {issueContent}
        </Link>
    );
}

function IssueList({
    issues,
    level,
    expanded,
}: {
    issues: IssueMessage[];
    expanded: boolean;
    level: number;
}) {
    return (
        <div className={blockIssue('list')}>
            {issues.map((issue, index) => (
                <Issue key={index} issue={issue} level={level} expanded={expanded} />
            ))}
        </div>
    );
}
