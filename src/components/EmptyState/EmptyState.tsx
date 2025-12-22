import {Flex, Icon, Text} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import emptyStateIcon from '../../assets/icons/emptyState.svg';

import './EmptyState.scss';

const block = cn('empty-state');

export const EMPTY_STATE_SIZES = {
    xs: 100,
    s: 150,
    m: 230,
    l: 350,
};

export interface EmptyStateProps {
    title: React.ReactNode;
    image?: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode[];
    size?: keyof typeof EMPTY_STATE_SIZES;
    position?: 'left' | 'center';
    pageTitle?: string;
    className?: string;
}

export const EmptyState = ({
    image,
    title,
    description,
    actions,
    size = 'm',
    position = 'center',
    pageTitle,
    className,
}: EmptyStateProps) => {
    return (
        <div className={block({size}, className)}>
            {pageTitle ? <Text variant="header-1">{pageTitle}</Text> : null}
            <div className={block('wrapper', {size, position})}>
                <div className={block('image')}>
                    {image ? (
                        image
                    ) : (
                        <Icon
                            data={emptyStateIcon}
                            width={EMPTY_STATE_SIZES[size]}
                            height={EMPTY_STATE_SIZES[size]}
                        />
                    )}
                </div>
                <Flex gap={5} className={block('content')} direction="column">
                    <Flex gap={3} direction="column">
                        <div className={block('title', {size})}>{title}</div>
                        {description ? (
                            <div className={block('description')}>{description}</div>
                        ) : null}
                    </Flex>
                    {actions ? <Flex gap={2}>{actions}</Flex> : null}
                </Flex>
            </div>
        </div>
    );
};

interface EmptyStateWrapperProps extends EmptyStateProps {
    isEmpty?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function EmptyStateWrapper({isEmpty, children, className, ...rest}: EmptyStateWrapperProps) {
    if (isEmpty) {
        return (
            <div className={className}>
                <EmptyState {...rest} />
            </div>
        );
    }
    return children;
}
