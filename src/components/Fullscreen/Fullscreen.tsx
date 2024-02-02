import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';

import {Button} from '@gravity-ui/uikit';
import cn from 'bem-cn-lite';

import {useDispatch} from 'react-redux';
import {disableFullscreen} from '../../store/reducers/fullscreen';
import {Icon} from '../Icon';

import './Fullscreen.scss';

const b = cn('kv-fullscreen');

interface FullscreenProps {
    children: React.ReactNode;
    className?: string;
}

interface FullscreenWrapperProps {
    children: React.ReactNode;
}

class FullscreenWrapper extends React.Component<FullscreenWrapperProps> {
    modalRoot: null | HTMLElement = null;
    private el: HTMLElement;

    constructor(props: FullscreenWrapperProps) {
        super(props);
        this.el = document.createElement('div');
    }

    componentDidMount() {
        this.modalRoot = document.getElementById('fullscreen-root');
        if (this.modalRoot) {
            this.modalRoot.appendChild(this.el);
        }
    }

    componentWillUnmount() {
        if (this.modalRoot) {
            this.modalRoot.removeChild(this.el);
        }
    }

    render() {
        return ReactDOM.createPortal(this.props.children, this.el);
    }
}

function Fullscreen(props: FullscreenProps) {
    const dispatch = useDispatch();
    const escFunction = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onDisableFullScreen();
        }
    };
    useEffect(() => {
        document.addEventListener('keydown', escFunction, false);
        return () => {
            document.removeEventListener('keydown', escFunction, false);
        };
    }, []);

    const onDisableFullScreen = () => {
        dispatch(disableFullscreen());
    };

    return (
        <FullscreenWrapper>
            <div className={b(null, props.className)}>
                <Button onClick={onDisableFullScreen} view="raised" className={b('close-button')}>
                    <Icon name="disableFullscreen" viewBox={'0 0 16 16 '} width={16} height={16} />
                </Button>
                {props.children}
            </div>
        </FullscreenWrapper>
    );
}

export default Fullscreen;
