import {SquareDashed} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {enableFullscreen} from '../../store/reducers/fullscreen';
import {useTypedDispatch} from '../../utils/hooks';

interface EnableFullscreenButtonProps {
    disabled?: boolean;
}

function EnableFullscreenButton({disabled}: EnableFullscreenButtonProps) {
    const dispatch = useTypedDispatch();
    const onEnableFullscreen = () => {
        dispatch(enableFullscreen());
    };
    return (
        <Button
            onClick={onEnableFullscreen}
            view="flat-secondary"
            disabled={disabled}
            title="Fullscreen"
        >
            <Icon data={SquareDashed} />
        </Button>
    );
}

export default EnableFullscreenButton;
