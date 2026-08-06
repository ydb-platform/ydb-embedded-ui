import React from 'react';

import type {HelpMarkProps} from '@gravity-ui/uikit';
import {Flex, HelpMark} from '@gravity-ui/uikit';

import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';

import {helpMarkWithDocsKeyset} from './i18n';

interface HelpMarkWithDocsProps extends Omit<HelpMarkProps, 'children'> {
    children: React.ReactNode;
    docsLink?: string;
    docsLinkTitle?: string;
}

export function HelpMarkWithDocs({
    children,
    docsLink,
    docsLinkTitle,
    ...helpMarkProps
}: HelpMarkWithDocsProps) {
    return (
        <HelpMark {...helpMarkProps}>
            <Flex direction="column" gap="2">
                {children}
                {docsLink ? (
                    <LinkWithIcon
                        url={docsLink}
                        title={docsLinkTitle ?? helpMarkWithDocsKeyset('action_learn-more')}
                    />
                ) : null}
            </Flex>
        </HelpMark>
    );
}
