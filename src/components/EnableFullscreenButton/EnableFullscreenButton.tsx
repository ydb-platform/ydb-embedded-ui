import {SquareDashed} from '@gravity-ui/icons';
import type {ButtonView} from '@gravity-ui/uikit';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

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
        <ActionTooltip title="Fullscreen">
            <Button onClick={onEnableFullscreen} view={view} disabled={disabled}>
                <Icon data={SquareDashed} />
            </Button>
        </ActionTooltip>
    );
}

export default EnableFullscreenButton;
