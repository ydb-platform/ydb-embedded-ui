import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import type {StatusFlag} from '../../../../types/api/healthcheck';
import {b} from '../shared';

function getTypeText(type: string) {
    const normalizedType = type.split('_').join(' ');
    let result = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).toLowerCase();
    result = result.replace(/\bvdisk\b/gi, 'VDisk').replace(/\bpdisk\b/gi, 'PDisk');
    return result;
}

interface HealthcheckIssueTabsProps {
    parents: IssuesTree[];
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
}

export function HealthcheckIssueTabs({
    parents,
    selectedTab,
    setSelectedTab,
}: HealthcheckIssueTabsProps) {
    //parent.length === 1 means that it's only issue itself, no need to render tabs
    if (parents.length <= 1) {
        return null;
    }

    return (
        <Flex gap={2} wrap="nowrap">
            {parents.map((parent, index) => (
                <Flex gap={2} key={parent.id} wrap="nowrap">
                    <HealthcjeckIssueTab
                        active={parent.id === selectedTab}
                        onClick={() => setSelectedTab(parent.id)}
                    >
                        <Flex gap={2} wrap="nowrap" alignItems="center">
                            {parent.status && <TabStatus status={parent.status} />}
                            {parent.type && getTypeText(parent.type)}
                        </Flex>
                    </HealthcjeckIssueTab>
                    {index !== parents.length - 1 && <Text color="secondary">/</Text>}
                </Flex>
            ))}
        </Flex>
    );
}

interface HealthcheckIssueTabProps {
    children: React.ReactNode;
    active?: boolean;
    onClick: VoidFunction;
}

function HealthcjeckIssueTab({children, active, onClick}: HealthcheckIssueTabProps) {
    return (
        <Text
            variant="body-2"
            color={active ? 'primary' : 'secondary'}
            className={b('issue-tab', {active})}
            onClick={onClick}
        >
            {children}
        </Text>
    );
}

interface TabStatusProps {
    status: StatusFlag;
}

function TabStatus({status}: TabStatusProps) {
    return <div className={b('tab-status', {[status.toLowerCase()]: true})} />;
}
