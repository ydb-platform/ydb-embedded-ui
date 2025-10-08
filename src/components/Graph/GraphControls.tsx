import {useCallback} from 'react';

import type {Graph} from '@gravity-ui/graph';
import {Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';

import MagnifierMinusIcon from '@gravity-ui/icons/svgs/magnifier-minus.svg';
import MagnifierPlusIcon from '@gravity-ui/icons/svgs/magnifier-plus.svg';

const b = cn('ydb-gravity-graph');

const ZOOM_STEP = 1.25;

interface Props {
    graph: Graph;
}

export const GraphControls = ({graph}: Props) => {
    const onZoomInClick = useCallback(() => {
        const cameraScale = graph.cameraService.getCameraScale();
        graph.zoom({scale: cameraScale * ZOOM_STEP});
    }, [graph]);

    const onZoomOutClick = useCallback(() => {
        const cameraScale = graph.cameraService.getCameraScale();
        graph.zoom({scale: cameraScale / ZOOM_STEP});
    }, [graph]);

    const onResetZoomClick = useCallback(() => {
        graph.zoom({scale: 1});
    }, [graph]);

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
