import {Wrench} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {createDeveloperUIInternalPageHref} from '../../utils/developerUI/developerUI';

import {headerKeyset} from './i18n';

export function DeveloperUIControl() {
    return (
        <ActionTooltip title={headerKeyset('description_developer-ui')}>
            <Button view="flat" href={createDeveloperUIInternalPageHref()} target="_blank">
                <Icon data={Wrench} />
                {headerKeyset('title_developer-ui')}
            </Button>
        </ActionTooltip>
    );
}
