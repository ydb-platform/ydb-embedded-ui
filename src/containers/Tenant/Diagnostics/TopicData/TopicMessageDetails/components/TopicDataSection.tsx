import {Flex} from '@gravity-ui/uikit';

import {b} from '../shared';

interface TopicDataSectionProps {
    children: React.ReactNode;
    title: React.ReactNode;
    className?: string;
    renderToolbar?: () => React.ReactNode;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function TopicDataSection({
    children,
    title,
    className,
    renderToolbar,
    scrollContainerRef,
}: TopicDataSectionProps) {
    return (
        <Flex direction="column" className={b('section', className)}>
            <Flex
                className={b('section-title-wrapper')}
                justifyContent="space-between"
                alignItems="center"
            >
                {title}
                {renderToolbar?.()}
            </Flex>
            <div className={b('section-content')}>
                <div className={b('section-scroll-container')} ref={scrollContainerRef}>
                    {children}
                </div>
            </div>
        </Flex>
    );
}
