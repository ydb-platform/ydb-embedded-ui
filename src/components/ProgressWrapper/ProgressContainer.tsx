import {Flex, Text} from '@gravity-ui/uikit';

import {getProgressStyle} from './progressUtils';
import type {ProgressContainerProps} from './types';

export function ProgressContainer({
    children,
    displayText,
    withValue = false,
    className,
    width,
}: ProgressContainerProps) {
    const progressStyle = getProgressStyle(width);

    return (
        <Flex alignItems="center" gap="2" className={className}>
            <div style={progressStyle}>{children}</div>
            {withValue && displayText && (
                <Text variant="body-1" color="secondary">
                    {displayText}
                </Text>
            )}
        </Flex>
    );
}
