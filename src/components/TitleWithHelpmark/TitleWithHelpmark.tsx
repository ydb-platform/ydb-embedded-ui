import React from 'react';

import {Flex, Text} from '@gravity-ui/uikit';

import {HelpMarkWithDocs} from '../HelpMarkWithDocs/HelpMarkWithDocs';

interface TitleWithHelpMarkProps {
    header: string;
    note: React.ReactNode;
    docsLink?: string;
    docsLinkTitle?: string;
}

export function TitleWithHelpMark({header, note, docsLink, docsLinkTitle}: TitleWithHelpMarkProps) {
    return (
        <Flex gap={1} alignItems="center">
            <Text variant="inherit" ellipsis title={header}>
                {header}
            </Text>
            <HelpMarkWithDocs
                aria-label={header}
                style={{flexShrink: 0}}
                onClick={(event) => event.stopPropagation()}
                docsLink={docsLink}
                docsLinkTitle={docsLinkTitle}
                popoverProps={{
                    placement: ['right', 'left', 'bottom', 'top'],
                    style: {maxWidth: 'min(360px, calc(100vw - 24px))', whiteSpace: 'pre-line'},
                }}
            >
                {note}
            </HelpMarkWithDocs>
        </Flex>
    );
}
