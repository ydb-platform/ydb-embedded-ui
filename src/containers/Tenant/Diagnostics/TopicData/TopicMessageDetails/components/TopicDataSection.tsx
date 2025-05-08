import {Flex} from '@gravity-ui/uikit';

import {b} from '../shared';

interface TopicDataSectionProps {
    children: React.ReactNode;
    title: React.ReactNode;
    className?: string;
    renderToolbar?: () => React.ReactNode;
}

export function TopicDataSection({
    children,
    title,
    className,
    renderToolbar,
}: TopicDataSectionProps) {
    return (
        <div className={b('section', className)}>
            <Flex
                className={b('section-title-wrapper')}
                justifyContent="space-between"
                alignItems="center"
            >
                <Flex gap={4}>
                    {title}
                    {renderToolbar?.()}
                </Flex>
            </Flex>
            <div className={b('section-content')}>{children}</div>
        </div>
    );
}
