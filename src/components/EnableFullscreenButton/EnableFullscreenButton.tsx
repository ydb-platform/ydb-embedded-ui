import {SquareDashed} from '@gravity-ui/icons';
import type {ButtonView} from '@gravity-ui/uikit';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {enableFullscreen} from '../../store/reducers/fullscreen';
import {useTypedDispatch} from '../../utils/hooks';

import i18n from './i18n';

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
        <ActionTooltip title={i18n('title_fullscreen')}>
            <Button onClick={onEnableFullscreen} view={view} disabled={disabled}>
                <Icon data={SquareDashed} />
            </Button>
        </ActionTooltip>
    );
}

export default EnableFullscreenButton;
