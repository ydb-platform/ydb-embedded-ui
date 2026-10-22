import {Switch} from '@gravity-ui/uikit';

import {useHideUnavailableNodes} from '../../utils/hooks/useHideUnavailableNodes';

import i18n from './i18n';

export function HideUnavailableNodesSwitch({className}: {className?: string}) {
    const {available, hideUnavailable, handleHideUnavailableChange} = useHideUnavailableNodes();

    if (!available) {
        return null;
    }

    return (
        <Switch
            className={className}
            size="m"
            checked={hideUnavailable}
            onUpdate={handleHideUnavailableChange}
            content={i18n('action_hide-unavailable')}
            qa="hide-unavailable-nodes"
        />
    );
}
