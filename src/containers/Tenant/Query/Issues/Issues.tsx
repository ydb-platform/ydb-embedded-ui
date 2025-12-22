import React from 'react';

import {
    CircleExclamationFill,
    CircleInfoFill,
    CircleXmarkFill,
    TriangleExclamationFill,
} from '@gravity-ui/icons';
import type {IconData} from '@gravity-ui/uikit';
import {ArrowToggle, Button, Flex, Icon, Link} from '@gravity-ui/uikit';

import ShortyString from '../../../../components/ShortyString/ShortyString';
import type {ErrorResponse, IssueMessage} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {isNumeric} from '../../../../utils/utils';

import {IssuesDialog} from './IssuesDialog';
import {getIssuePosition, getMostSevere, hasRootIssues, normalizeRoots} from './helpers';
import i18n from './i18n';
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

function ErrorStringMessage({message}: {message: string}) {
    return <div className={blockWrapper('error-message')}>{message}</div>;
}

export function ResultIssues({data, hideSeverity}: ResultIssuesProps) {
    const roots = normalizeRoots(data);

    const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

    const onToggleInline = (idx: number) => setExpanded((p) => ({...p, [idx]: !p[idx]}));

    if (typeof data === 'string') {
        return <ErrorStringMessage message={data} />;
    }

    return (
        <div className={blockWrapper()}>
            <Flex direction="column" gap="2">
                {roots.map((root, idx) => {
                    const hasIssues = hasRootIssues(root.issues);

                    return (
                        <React.Fragment key={idx}>
                            <ErrorPreviewItem
                                severity={getSeverity(root.severity)}
                                message={root.message || ''}
                                hideSeverity={hideSeverity}
                                hasIssues={hasIssues}
                                expanded={expanded[idx]}
                                onClick={() => onToggleInline(idx)}
                            />
                            {expanded[idx] && hasIssues && (
                                <Issues hideSeverity={hideSeverity} issues={root.issues} />
                            )}
                        </React.Fragment>
                    );
                })}
            </Flex>
        </div>
    );
}

export function ResultIssuesModal({data, hideSeverity}: ResultIssuesProps) {
    const roots = normalizeRoots(data);

    const [open, setOpen] = React.useState(false);
    const [currentIssues, setCurrentIssues] = React.useState<IssueMessage[] | null>(null);

    const openDialog = (issues?: IssueMessage[]) => {
        setCurrentIssues(issues ?? []);
        setOpen(true);
    };
    const closeDialog = () => setOpen(false);

    if (typeof data === 'string') {
        return <ErrorStringMessage message={data} />;
    }

    return (
        <React.Fragment>
            <div className={blockWrapper()}>
                <Flex direction="column" gap="2">
                    {roots.map((root, idx) => {
                        const hasIssues = hasRootIssues(root.issues);

                        return (
                            <ErrorPreviewItem
                                key={idx}
                                severity={getSeverity(root.severity)}
                                message={root.message || ''}
                                hideSeverity={hideSeverity}
                                hasIssues={hasIssues}
                                onClick={() => openDialog(root.issues)}
                            />
                        );
                    })}
                </Flex>
            </div>

            <IssuesDialog
                open={open}
                issues={currentIssues ?? []}
                hideSeverity={hideSeverity}
                onClose={closeDialog}
                textButtonCancel={i18n('action_close')}
            />
        </React.Fragment>
    );
}

interface ErrorPreviewItemProps {
    severity: SEVERITY;
    message?: string;
    hideSeverity?: boolean;
    hasIssues?: boolean;
    expanded?: boolean;
    onClick: () => void;
}

export function ErrorPreviewItem({
    severity,
    message,
    hideSeverity,
    hasIssues,
    expanded,
    onClick,
}: ErrorPreviewItemProps) {
    const buttonLabel = expanded ? i18n('action_hide-details') : i18n('action_show-details');

    return (
        <div className={blockWrapper('error-message')}>
            {hideSeverity ? null : <IssueSeverity severity={severity} />}
            <span className={blockWrapper('error-message-text')}>{message}</span>

            {hasIssues && (
                <Button view="normal" size="s" onClick={onClick}>
                    {buttonLabel}
                </Button>
            )}
        </div>
    );
}

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
