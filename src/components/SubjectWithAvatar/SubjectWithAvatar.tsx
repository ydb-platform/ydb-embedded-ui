import type React from 'react';

import {Avatar, Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

export const block = cn('ydb-subject-with-avatar');

import './SubjectWithAvatar.scss';

interface SubjectProps {
    subject: string;
    title?: string;
    avatar?: React.ReactNode;
    renderIcon?: () => React.ReactNode;
}

export function SubjectWithAvatar({subject, title, avatar, renderIcon}: SubjectProps) {
    return (
        <Flex gap={2} alignItems="center">
            <div className={block('avatar-wrapper')}>
                {avatar ?? <Avatar theme="brand" text={subject} title={subject} />}
                {renderIcon?.()}
            </div>
            <Flex direction="column" overflow="hidden">
                <Text variant="body-2" className={block('subject')}>
                    {subject}
                </Text>
                {title && (
                    <Text variant="body-2" color="secondary">
                        {title}
                    </Text>
                )}
            </Flex>
        </Flex>
    );
}
