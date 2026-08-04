import React from 'react';

import {ArrowToggle, Disclosure, Divider, Flex, Text} from '@gravity-ui/uikit';

import {useComponent} from '../../../../components/ComponentsProvider/ComponentsProvider';
import {EntityStatus} from '../../../../components/EntityStatusNew/EntityStatus';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {hcStatusToColorFlag} from '../../../../store/reducers/healthcheckInfo/utils';
import {useHealthcheckContext} from '../HealthcheckContext';
import {b} from '../shared';

import {IssueDetails} from './HealthcheckIssueDetails/HealthcheckIssueDetails';
import {HealthcheckIssueTabs} from './HealthcheckIssueTabs';

interface HealthcheckIssueProps {
    issue: IssuesTree;
    expanded?: boolean;
}

export function HealthcheckIssue({issue, expanded}: HealthcheckIssueProps) {
    const HealthcheckAssistantAction = useComponent('HealthcheckAssistantAction');
    const {assistant} = useHealthcheckContext();
    const [selectedTab, setSelectedTab] = React.useState(issue.id);
    const parents = React.useMemo(() => {
        const parents = [];
        let current: IssuesTree | undefined = issue;
        while (current) {
            parents.push(current);
            current = current.parent;
        }
        return parents.reverse();
    }, [issue]);

    const currentIssue = React.useMemo(() => {
        return parents.find((parent) => parent.id === selectedTab);
    }, [parents, selectedTab]);
    const rawIssue = React.useMemo(
        () => assistant?.snapshot.issues.find((item) => item.id === issue.id) ?? issue,
        [assistant?.snapshot.issues, issue],
    );

    return (
        <Flex className={b('issue-wrapper')}>
            <Disclosure className={b('issue-content')} defaultExpanded={expanded}>
                <Disclosure.Summary>
                    {(props) => {
                        if (!assistant) {
                            return (
                                <button
                                    aria-controls={props.ariaControls}
                                    aria-expanded={props.expanded}
                                    className={b('disclosure-trigger')}
                                    data-qa={props.qa}
                                    disabled={props.disabled}
                                    id={props.id}
                                    onClick={props.onClick}
                                    onKeyDown={props.onKeyDown}
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
                                            <ArrowToggle
                                                direction={props.expanded ? 'top' : 'bottom'}
                                            />
                                        </Flex>
                                    </Flex>
                                </button>
                            );
                        }

                        return (
                            <Flex
                                wrap="nowrap"
                                gap={2}
                                alignItems="center"
                                className={b('issue-summary')}
                            >
                                <button
                                    aria-controls={props.ariaControls}
                                    aria-expanded={props.expanded}
                                    className={b('disclosure-trigger', {'with-action': true})}
                                    data-qa={props.qa}
                                    disabled={props.disabled}
                                    id={props.id}
                                    onClick={props.onClick}
                                    onKeyDown={props.onKeyDown}
                                >
                                    <Flex
                                        wrap="nowrap"
                                        gap={2}
                                        justifyContent="space-between"
                                        alignItems="center"
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
                                        <Divider
                                            className={b('issue-divider')}
                                            orientation="vertical"
                                        />
                                        <ArrowToggle
                                            direction={props.expanded ? 'top' : 'bottom'}
                                        />
                                    </Flex>
                                </button>
                                <div
                                    className={b('issue-action')}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <HealthcheckAssistantAction
                                        action="fix"
                                        target={assistant.target}
                                        snapshot={assistant.snapshot}
                                        issue={rawIssue}
                                    />
                                </div>
                            </Flex>
                        );
                    }}
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
