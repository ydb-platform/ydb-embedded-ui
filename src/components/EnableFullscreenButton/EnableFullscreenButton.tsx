import {SquareDashed} from '@gravity-ui/icons';
import type {ButtonView} from '@gravity-ui/uikit';
import {Button, Icon} from '@gravity-ui/uikit';

import {enableFullscreen} from '../../store/reducers/fullscreen';
import {useTypedDispatch} from '../../utils/hooks';

interface EnableFullscreenButtonProps {
    disabled?: boolean;
    view?: ButtonView;
}

function EnableFullscreenButton({disabled, view = 'flat-secondary'}: EnableFullscreenButtonProps) {
    const dispatch = useTypedDispatch();
    const onEnableFullscreen = () => {
        dispatch(enableFullscreen());
    };
    return (
        <Button onClick={onEnableFullscreen} view={view} disabled={disabled} title="Fullscreen">
            <Icon data={SquareDashed} />
        </Button>
    );
}

export default EnableFullscreenButton;
