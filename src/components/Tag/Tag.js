import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import './Tag.scss';

const b = cn('tag');

export const Tag = ({text, type}) => {
    return <div className={b({type})}>{text}</div>;
};

Tag.propTypes = {
    text: PropTypes.string,
    type: PropTypes.string,
};
