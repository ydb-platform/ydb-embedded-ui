import {Button} from '@gravity-ui/uikit';
import {useDispatch} from 'react-redux';
import {enableFullscreen} from '../../store/reducers/fullscreen';
import Icon from '../Icon/Icon';

interface EnableFullscreenButtonProps {
    disabled?: boolean;
}

function EnableFullscreenButton({disabled}: EnableFullscreenButtonProps) {
    const dispatch = useDispatch();
    const onEnableFullscreen = () => {
        dispatch(enableFullscreen());
    };
    return (
        <Button onClick={onEnableFullscreen} view="flat-secondary" disabled={disabled} title='Fullscreen'>
            <Icon name="enableFullscreen" viewBox={'0 0 16 16'} height={16} width={16} />
        </Button>
    );
}

export default EnableFullscreenButton;
