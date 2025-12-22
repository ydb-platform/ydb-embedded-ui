import React from 'react';

import type {FlexProps} from '@gravity-ui/uikit';
import {Flex, Label} from '@gravity-ui/uikit';

interface TagsProps {
    tags: React.ReactNode[];
    className?: string;
    gap?: FlexProps['gap'];
}

export const Tags = ({tags, className = '', gap = 1}: TagsProps) => {
    return (
        <Flex className={className} gap={gap} wrap="wrap" alignItems="center">
            {tags &&
                tags.map((tag, tagIndex) => (
                    <Label size="s" key={tagIndex}>
                        {tag}
                    </Label>
                ))}
        </Flex>
    );
};
