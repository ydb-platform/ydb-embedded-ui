import {ArrowsRotateLeft} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import {nanoid} from '@reduxjs/toolkit';

import {api} from '../../../../store/reducers/api';
import {useTypedDispatch} from '../../../../utils/hooks';
import {useDispatchTreeKey} from '../UpdateTreeContext';
import {b} from '../shared';

export function RefreshTreeButton() {
    const updateTreeKey = useDispatchTreeKey();
    const dispatch = useTypedDispatch();

    return (
        <ActionTooltip title="Refresh">
            <Button
                className={b('refresh-button')}
                view="flat-secondary"
                onClick={() => {
                    updateTreeKey(nanoid());
                    dispatch(api.util.invalidateTags(['SchemaTree']));
                }}
            >
                <Icon data={ArrowsRotateLeft} />
            </Button>
        </ActionTooltip>
    );
}
