import cn from 'bem-cn-lite';

import {Tag, TagType} from '../Tag';

import './Tags.scss';

const b = cn('tags');

interface TagsProps {
    tags: string[];
    tagsType?: TagType;
    className?: string;
}

export const Tags = ({tags, tagsType, className = ''}: TagsProps) => {
    return (
        <div className={b(null, className)}>
            {tags &&
                tags.map((tag, tagIndex) => <Tag text={tag} key={tagIndex} type={tagsType}></Tag>)}
        </div>
    );
};
