import {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import {Icon} from '../Icon';

import './EmptyState.scss';

const block = cn('empty-state');

const sizes = {
    s: 150,
    m: 250,
    l: 350,
};

export interface EmptyStateProps {
    title: string;
    image?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode[];
    size?: keyof typeof sizes;
    centered?: boolean;
}

export const EmptyState = ({
    image,
    title,
    description,
    actions,
    size = 'm',
    centered = true,
}: EmptyStateProps) => {
    return (
        <div className={block({size})}>
            <div className={block('wrapper', {size, centered})}>
                <div className={block('image')}>
                    {image ? (
                        image
                    ) : (
                        <Icon
                            viewBox="0 0 383 396"
                            name="emptyState"
                            width={sizes[size]}
                            height={sizes[size]}
                        />
                    )}
                </div>

                <div className={block('title', {size})}>{title}</div>
                <div className={block('description')}>{description}</div>
                <div className={block('actions')}>{actions}</div>
            </div>
        </div>
    );
};
