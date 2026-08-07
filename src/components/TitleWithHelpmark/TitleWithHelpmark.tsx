import React from 'react';

import {Flex} from '@gravity-ui/uikit';

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
            {header}
            <HelpMarkWithDocs
                aria-label={header}
                docsLink={docsLink}
                docsLinkTitle={docsLinkTitle}
                popoverProps={{placement: ['right', 'left']}}
            >
                {note}
            </HelpMarkWithDocs>
        </Flex>
    );
}
