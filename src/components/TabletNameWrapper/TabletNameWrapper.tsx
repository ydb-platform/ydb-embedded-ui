import {DefinitionList, PopoverBehavior} from '@gravity-ui/uikit';

import {getTabletPagePath} from '../../routes';
import {createTabletDeveloperUIHref} from '../../utils/developerUI/developerUI';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';

import i18n from './i18n';

interface TabletNameWrapperProps {
    tabletId: string | number;
    database?: string;
}

export function TabletNameWrapper({tabletId, database}: TabletNameWrapperProps) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const tabletPath = getTabletPagePath(tabletId, {database});

    return (
        <CellWithPopover
            disabled={!isUserAllowedToMakeChanges}
            delayClosing={200}
            content={
                <DefinitionList responsive>
                    <DefinitionList.Item name={i18n('field_links')}>
                        <LinkWithIcon
                            title={i18n('context_developer-ui')}
                            url={createTabletDeveloperUIHref(tabletId)}
                        />
                    </DefinitionList.Item>
                </DefinitionList>
            }
            placement={['top', 'bottom']}
            behavior={PopoverBehavior.Immediate}
        >
            <EntityStatus
                name={tabletId.toString()}
                path={tabletPath}
                hasClipboardButton
                showStatus={false}
            />
        </CellWithPopover>
    );
}
