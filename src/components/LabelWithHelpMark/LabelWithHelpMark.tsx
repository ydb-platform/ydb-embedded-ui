import React from 'react';

import type {HelpMarkProps, LabelProps} from '@gravity-ui/uikit';
import {Flex, HelpMark, Label} from '@gravity-ui/uikit';

interface LabelWithHelpMarkProps extends LabelProps {
    help?: React.ReactNode;
    helpMarkProps?: Omit<HelpMarkProps, 'children'>;
    contentGap?: React.ComponentProps<typeof Flex>['gap'];
}

export function LabelWithHelpMark({
    children,
    help,
    helpMarkProps,
    contentGap = '1',
    ...labelProps
}: LabelWithHelpMarkProps) {
    return (
        <Label {...labelProps}>
            <Flex alignItems="center" gap={contentGap} wrap="nowrap">
                {children}
                {help ? (
                    <HelpMark iconSize="s" {...helpMarkProps}>
                        {help}
                    </HelpMark>
                ) : null}
            </Flex>
        </Label>
    );
}
