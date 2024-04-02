import {cn} from '../../utils/cn';

import './Tag.scss';

const b = cn('tag');

export type TagType = 'blue';

interface TagProps {
    text: string;
    type?: TagType;
}

export const Tag = ({text, type}: TagProps) => {
    return <div className={b({type})}>{text}</div>;
};
