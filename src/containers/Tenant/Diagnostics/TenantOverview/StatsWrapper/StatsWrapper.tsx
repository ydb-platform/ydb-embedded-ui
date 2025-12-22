import {Flex, Text} from '@gravity-ui/uikit';

import {SeeAllButton} from '../../../../../components/SeeAllButton/SeeAllButton';
import {cn} from '../../../../../utils/cn';

const b = cn('ydb-stats-wrapper');

import './StatsWrapper.scss';

interface StatsWrapperProps {
    children: React.ReactNode;
    className?: string;
    title: string;
    description?: string;
    allEntitiesLink?: string;
    onAllEntitiesClick?: () => void;
}

export function StatsWrapper({
    children,
    className,
    title,
    description,
    allEntitiesLink,
    onAllEntitiesClick,
}: StatsWrapperProps) {
    return (
        <Flex className={b(null, className)} gap={2} direction="column">
            <Flex justifyContent="space-between" wrap="nowrap" className={b('header')}>
                <Flex direction="column">
                    <Text variant="subheader-2">{title}</Text>
                    {description && <Text color="secondary">{description}</Text>}
                </Flex>
                {allEntitiesLink && (
                    <SeeAllButton to={allEntitiesLink} onClick={onAllEntitiesClick} />
                )}
            </Flex>
            {children}
        </Flex>
    );
}
