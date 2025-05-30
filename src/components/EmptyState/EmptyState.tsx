import {Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import emptyStateIcon from '../../assets/icons/emptyState.svg';

import './EmptyState.scss';

const block = cn('empty-state');

const sizes = {
    xs: 100,
    s: 150,
    m: 250,
    l: 350,
};

export interface EmptyStateProps {
    title: string;
    image?: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode[];
    size?: keyof typeof sizes;
    position?: 'left' | 'center';
}

export const EmptyState = ({
    image,
    title,
    description,
    actions,
    size = 'm',
    position = 'center',
}: EmptyStateProps) => {
    return (
        <div className={block({size})}>
            <div className={block('wrapper', {size, position})}>
                <div className={block('image')}>
                    {image ? (
                        image
                    ) : (
                        <Icon data={emptyStateIcon} width={sizes[size]} height={sizes[size]} />
                    )}
                </div>

                <div className={block('title', {size})}>{title}</div>
                <div className={block('description')}>{description}</div>
                <div className={block('actions')}>{actions}</div>
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
