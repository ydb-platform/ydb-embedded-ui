import {ArrowsRotateLeft} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import {nanoid} from '@reduxjs/toolkit';

import {useDispatchTreeKey} from '../UpdateTreeContext';
import {b} from '../shared';

export function RefreshTreeButton() {
    const updateTreeKey = useDispatchTreeKey();
    return (
        <ActionTooltip title="Refresh">
            <Button
                className={b('refresh-button')}
                view="flat-secondary"
                onClick={() => {
                    updateTreeKey(nanoid());
                }}
            >
                <Icon data={ArrowsRotateLeft} />
            </Button>
        </ActionTooltip>
    );
}
