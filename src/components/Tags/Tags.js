import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';

import {Tag} from '../Tag/Tag';

import './Tags.scss';

const b = cn('tags');

class Tags extends React.Component {
    static propTypes = {
        className: PropTypes.string,
        tags: PropTypes.arrayOf(PropTypes.string).isRequired,
        tagsType: PropTypes.string,
    };

    static defaultProps = {
        className: '',
    };

    render() {
        const {tags, className, tagsType} = this.props;

        return (
            <div className={`${b()} ${className}`}>
                {tags &&
                    tags.map((tag, tagIndex) => (
                        <Tag text={tag} key={tagIndex} type={tagsType}></Tag>
                    ))}
            </div>
        );
    }
}

export default Tags;
