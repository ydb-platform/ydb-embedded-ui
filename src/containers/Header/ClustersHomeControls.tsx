import {CirclePlus} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {uiFactory} from '../../uiFactory/uiFactory';

import {headerKeyset} from './i18n';

export function ClustersHomeControls() {
    const onAddCluster = uiFactory.onAddCluster;
    if (!onAddCluster) {
        return null;
    }
    return (
        <Button view="flat" onClick={() => onAddCluster()}>
            <Icon data={CirclePlus} />
            {headerKeyset('title_add-cluster')}
        </Button>
    );
}
