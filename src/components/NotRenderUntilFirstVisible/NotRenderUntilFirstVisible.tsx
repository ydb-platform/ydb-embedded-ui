import React from 'react';

import {Freeze} from 'react-freeze';

import {cn} from '../../utils/cn';

import {IsFrozenProvider} from './IsFrozenProvider';

import './NotRenderUntilFirstVisible.scss';

const block = cn('ydb-not-render-until-first-visible');

interface Props {
    show?: boolean;
    className?: string;
    children: React.ReactNode;
}

export default function NotRenderUntilFirstVisible({show, className, children}: Props) {
    const [isFrozen, setIsFrozen] = React.useState(!show);

    // Render component before freezing to update frozen status in nested components
    React.useEffect(() => {
        if (show) {
            setIsFrozen(false);
        } else {
            setIsFrozen(true);
        }
    }, [show]);

    return (
        <div style={show ? undefined : {display: 'none'}} className={block(null, className)}>
            <IsFrozenProvider isFrozen={!show}>
                <Freeze freeze={show ? false : isFrozen}>{children}</Freeze>
            </IsFrozenProvider>
        </div>
    );
}
