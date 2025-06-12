import {Avatar, Flex, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

export const block = cn('ydb-subject-with-avatar');

import './SubjectWithAvatar.scss';

interface SubjectProps {
    subject: string;
    title?: string;
    renderIcon?: () => React.ReactNode;
}

export function SubjectWithAvatar({subject, title, renderIcon}: SubjectProps) {
    return (
        <Flex gap={2} alignItems="center">
            <div className={block('avatar-wrapper')}>
                <Avatar theme="brand" text={subject} title={subject} />
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
