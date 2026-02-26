import React from 'react';

import {Button, Flex} from '@gravity-ui/uikit';

import type {ErrorResponse, IssueMessage} from '../../types/api/query';
import {cn} from '../../utils/cn';

import {IssueSeverity} from './IssueSeverity';
import {Issues} from './Issues';
import {IssuesDialog} from './IssuesDialog';
import {hasRootIssues, normalizeRoots} from './helpers';
import i18n from './i18n';
import {getSeverity} from './models';

import './ResultIssues.scss';

const b = cn('kv-result-issues');

interface ResultIssuesProps {
    data: ErrorResponse | string;
    hideSeverity?: boolean;
}

function ErrorStringMessage({message}: {message: string}) {
    return <div className={b('error-message')}>{message}</div>;
}

interface ErrorPreviewItemProps {
    severity: ReturnType<typeof getSeverity>;
    message?: string;
    hideSeverity?: boolean;
    hasIssues?: boolean;
    expanded?: boolean;
    onClick: () => void;
}

function ErrorPreviewItem({
    severity,
    message,
    hideSeverity,
    hasIssues,
    expanded,
    onClick,
}: ErrorPreviewItemProps) {
    const buttonLabel = expanded ? i18n('action_hide-details') : i18n('action_show-details');

    return (
        <div className={b('error-message')}>
            {hideSeverity ? null : <IssueSeverity severity={severity} />}
            <span className={b('error-message-text')}>{message}</span>
            {hasIssues && (
                <Button view="normal" size="s" onClick={onClick}>
                    {buttonLabel}
                </Button>
            )}
        </div>
    );
}

export function ResultIssues({data, hideSeverity}: ResultIssuesProps) {
    const roots = normalizeRoots(data);
    const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});
    const onToggleInline = (idx: number) => setExpanded((p) => ({...p, [idx]: !p[idx]}));

    if (typeof data === 'string') {
        return <ErrorStringMessage message={data} />;
    }

    return (
        <div className={b()}>
            <Flex direction="column" gap="2">
                {roots.map((root, idx) => {
                    const rootHasIssues = hasRootIssues(root.issues);
                    return (
                        <React.Fragment key={idx}>
                            <ErrorPreviewItem
                                severity={getSeverity(root.severity)}
                                message={root.message || ''}
                                hideSeverity={hideSeverity}
                                hasIssues={rootHasIssues}
                                expanded={expanded[idx]}
                                onClick={() => onToggleInline(idx)}
                            />
                            {expanded[idx] && rootHasIssues && (
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
            <div className={b()}>
                <Flex direction="column" gap="2">
                    {roots.map((root, idx) => {
                        const rootHasIssues = hasRootIssues(root.issues);
                        return (
                            <ErrorPreviewItem
                                key={idx}
                                severity={getSeverity(root.severity)}
                                message={root.message || ''}
                                hideSeverity={hideSeverity}
                                hasIssues={rootHasIssues}
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
