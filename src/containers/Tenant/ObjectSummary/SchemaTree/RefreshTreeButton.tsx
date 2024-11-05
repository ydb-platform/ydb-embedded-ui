import {ArrowsRotateLeft} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import {nanoid} from '@reduxjs/toolkit';

import {useDispatchTreeKey} from '../UpdateTreeContext';

export function RefreshTreeButton() {
    const updateTreeKey = useDispatchTreeKey();
    return (
        <ActionTooltip title="Refresh">
            <Button
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
