import type {Graph} from '@gravity-ui/graph';
import MagnifierMinusIcon from '@gravity-ui/icons/svgs/magnifier-minus.svg';
import MagnifierPlusIcon from '@gravity-ui/icons/svgs/magnifier-plus.svg';
import {Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
const b = cn('ydb-gravity-graph');

const ZOOM_STEP = 1.25;

interface Props {
    graph: Graph;
}

export const GraphControls = ({graph}: Props) => {
    const onZoomInClick = () => {
        const cameraScale = graph.cameraService.getCameraScale();
        graph.zoom({scale: cameraScale * ZOOM_STEP});
    };

    const onZoomOutClick = () => {
        const cameraScale = graph.cameraService.getCameraScale();
        graph.zoom({scale: cameraScale / ZOOM_STEP});
    };

    const onResetZoomClick = () => {
        graph.zoom({scale: 1});
    };

    return (
        <div className={b('zoom-controls')}>
            <Button view="raised" onClick={onZoomInClick}>
                <Icon data={MagnifierPlusIcon} size={16} />
            </Button>
            <Button view="raised" onClick={onZoomOutClick}>
                <Icon data={MagnifierMinusIcon} size={16} />
            </Button>
            <Button view="raised" onClick={onResetZoomClick}>
                1:1
            </Button>
        </div>
    );
};
