import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import Icon from '../Icon/Icon';

import './EmptyState.scss';

const block = cn('empty-state');

const sizes = {
    s: 150,
    m: 250,
    l: 350,
};

export default function EmptyState({image, title, description, actions, size}) {
    return (
        <div className={block({size})}>
            <div className={block('wrapper', {size})}>
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
}

EmptyState.propTypes = {
    title: PropTypes.string.isRequired,
    image: PropTypes.node,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    actions: PropTypes.arrayOf(PropTypes.node),
    size: PropTypes.string,
};

EmptyState.defaultProps = {
    size: 'm',
};
