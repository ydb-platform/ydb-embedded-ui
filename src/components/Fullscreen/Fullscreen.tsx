import React from 'react';

import {Button, Icon} from '@gravity-ui/uikit';
import ReactDOM from 'react-dom';

import {disableFullscreen} from '../../store/reducers/fullscreen';
import {cn} from '../../utils/cn';
import {useTypedDispatch} from '../../utils/hooks';

import disableFullscreenIcon from '../../assets/icons/disableFullscreen.svg';

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
    const dispatch = useTypedDispatch();

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

    return (
        <FullscreenWrapper>
            <div className={b(null, props.className)}>
                <Button onClick={onDisableFullScreen} view="raised" className={b('close-button')}>
                    <Icon data={disableFullscreenIcon} />
                </Button>
                {props.children}
            </div>
        </FullscreenWrapper>
    );
}

export default Fullscreen;
