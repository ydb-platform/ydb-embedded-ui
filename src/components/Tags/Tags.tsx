import React from 'react';

import type {FlexProps} from '@gravity-ui/uikit';
import {Flex} from '@gravity-ui/uikit';

import type {TagType} from '../Tag';
import {Tag} from '../Tag';

interface TagsProps {
    tags: React.ReactNode[];
    tagsType?: TagType;
    className?: string;
    gap?: FlexProps['gap'];
}

export const Tags = ({tags, tagsType, className = '', gap = 1}: TagsProps) => {
    return (
        <Flex className={className} gap={gap} wrap="wrap" alignItems="center">
            {tags &&
                tags.map((tag, tagIndex) => <Tag text={tag} key={tagIndex} type={tagsType}></Tag>)}
        </Flex>
    );
};
