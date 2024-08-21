import React from 'react';

import {Freeze} from 'react-freeze';

import {cn} from '../../utils/cn';

import './NotRenderUntilFirstVisible.scss';

const block = cn('ydb-not-render-until-first-visible');

interface Props {
    show?: boolean;
    className?: string;
    children: React.ReactNode;
}

export default function NotRenderUntilFirstVisible({show, className, children}: Props) {
    return (
        <div style={show ? undefined : {display: 'none'}} className={block(null, className)}>
            <Freeze freeze={!show}>{children}</Freeze>
        </div>
    );
}
