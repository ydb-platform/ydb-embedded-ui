import React from 'react';

import {ArrowToggle, Disclosure, Divider, Flex, Text} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatusNew/EntityStatus';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {hcStatusToColorFlag} from '../../../../store/reducers/healthcheckInfo/utils';
import {b} from '../shared';

import {IssueDetails} from './HealthcheckIssueDetails/HealthcheckIssueDetails';
import {HealthcheckIssueTabs} from './HealthcheckIssueTabs';

interface HealthcheckIssueProps {
    issue: IssuesTree;
    expanded?: boolean;
    targeted?: boolean;
    targetIssueId?: string;
    targetRef?: React.Ref<HTMLDivElement>;
}

export function HealthcheckIssue({
    issue,
    expanded,
    targeted,
    targetIssueId,
    targetRef,
}: HealthcheckIssueProps) {
    const parents = React.useMemo(() => {
        const parents = [];
        let current: IssuesTree | undefined = issue;
        while (current) {
            parents.push(current);
            current = current.parent;
        }
        return parents.reverse();
    }, [issue]);
    const [selectedTab, setSelectedTab] = React.useState(
        targetIssueId && parents.some((parentIssue) => parentIssue.id === targetIssueId)
            ? targetIssueId
            : issue.id,
    );

    const currentIssue = React.useMemo(() => {
        return parents.find((parent) => parent.id === selectedTab);
    }, [parents, selectedTab]);

    return (
        <Flex ref={targetRef} className={b('issue-wrapper')} qa={`healthcheck-issue-${issue.id}`}>
            <Disclosure className={b('issue-content')} defaultExpanded={expanded || targeted}>
                <Disclosure.Summary>
                    {({expanded: isExpanded, ariaControls, qa, className, ...buttonProps}) => (
                        <button
                            {...buttonProps}
                            type="button"
                            aria-controls={ariaControls}
                            aria-expanded={isExpanded}
                            data-qa={qa}
                            className={b('disclosure-trigger', className)}
                        >
                            <Flex
                                wrap="nowrap"
                                gap={2}
                                justifyContent="space-between"
                                className={b('issue-summary')}
                            >
                                <Flex direction="column" gap={1} alignSelf="center">
                                    <Text variant="subheader-2">{issue.message}</Text>

                                    {issue.status && (
                                        <div className={b('issue-status')}>
                                            <EntityStatus.Label
                                                size="s"
                                                status={hcStatusToColorFlag[issue.status]}
                                            />
                                        </div>
                                    )}
                                </Flex>
                                <Flex
                                    wrap="nowrap"
                                    gap={2}
                                    alignItems="center"
                                    height="max-content"
                                >
                                    <Divider
                                        className={b('issue-divider')}
                                        orientation="vertical"
                                    />
                                    <ArrowToggle direction={isExpanded ? 'top' : 'bottom'} />
                                </Flex>
                            </Flex>
                        </button>
                    )}
                </Disclosure.Summary>
                <div className={b('animation-container')}>
                    <Flex className={b('issue-details')} direction="column" gap={3} grow={1}>
                        <HealthcheckIssueTabs
                            parents={parents}
                            selectedTab={selectedTab}
                            setSelectedTab={setSelectedTab}
                        />
                        {currentIssue && <IssueDetails issue={currentIssue} />}
                    </Flex>
                </div>
            </Disclosure>
        </Flex>
    );
}
