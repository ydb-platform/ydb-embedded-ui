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
}

export function HealthcheckIssue({issue}: HealthcheckIssueProps) {
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

    return (
        <Flex className={b('issue-wrapper')}>
            <Disclosure className={b('issue-content')}>
                <Disclosure.Summary>
                    {(props) => (
                        <div {...props}>
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
                                <Flex wrap="nowrap" gap={2}>
                                    <Divider
                                        className={b('issue-divider')}
                                        orientation="vertical"
                                    />
                                    <ArrowToggle direction={props.expanded ? 'top' : 'bottom'} />
                                </Flex>
                            </Flex>
                        </div>
                    )}
                </Disclosure.Summary>
                <Flex className={b('issue-details')} direction="column" gap={3} grow={1}>
                    <HealthcheckIssueTabs
                        parents={parents}
                        selectedTab={selectedTab}
                        setSelectedTab={setSelectedTab}
                    />
                    {currentIssue && <IssueDetails issue={currentIssue} />}
                </Flex>
            </Disclosure>
        </Flex>
    );
}
