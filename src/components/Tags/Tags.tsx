import {cn} from '../../utils/cn';
import type {TagType} from '../Tag';
import {Tag} from '../Tag';

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
