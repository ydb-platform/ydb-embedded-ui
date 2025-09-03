import React from 'react';

import {Button, Icon} from '@gravity-ui/uikit';

import {disableFullscreen} from '../../store/reducers/fullscreen';
import {cn} from '../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {Portal} from '../Portal/Portal';

import disableFullscreenIcon from '../../assets/icons/disableFullscreen.svg';

import './Fullscreen.scss';

const b = cn('ydb-fullscreen');

interface FullscreenProps {
    children: React.ReactNode;
    className?: string;
}

export function Fullscreen({children, className}: FullscreenProps) {
    const isFullscreen = useTypedSelector((state) => state.fullscreen);
    const dispatch = useTypedDispatch();

    const fullscreenRoot = React.useMemo(
        () => document.getElementById('fullscreen-root') ?? undefined,
        [],
    );

    const onDisableFullScreen = React.useCallback(() => {
        dispatch(disableFullscreen());
    }, [dispatch]);

    React.useEffect(() => {
        const escFunction = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onDisableFullScreen();
            }
        };

        document.addEventListener('keydown', escFunction, false);
        return () => {
            document.removeEventListener('keydown', escFunction, false);
        };
    }, [onDisableFullScreen]);

    const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
    React.useEffect(() => {
        const div = document.createElement('div');
        fullscreenRoot?.appendChild(div);
        div.style.display = 'contents';
        setContainer(div);
        return () => {
            setContainer(null);
            div.remove();
        };
    }, [fullscreenRoot]);

    const ref = React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(() => {
        if (container) {
            if (isFullscreen) {
                fullscreenRoot?.appendChild(container);
            } else {
                ref.current?.appendChild(container);
            }
        }
    }, [container, fullscreenRoot, isFullscreen]);

    if (!container) {
        return null;
    }

    return (
        <div ref={ref} style={{display: 'contents'}}>
            <Portal container={container}>
                <div className={b({fullscreen: isFullscreen}, className)}>
                    <Button
                        onClick={onDisableFullScreen}
                        view="raised"
                        className={b('close-button')}
                    >
                        <Icon data={disableFullscreenIcon} />
                    </Button>
                    <div className={b('content')}>{children}</div>
                </div>
            </Portal>
        </div>
    );
}
