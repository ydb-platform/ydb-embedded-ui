import {Icon, PlaceholderContainer} from '@gravity-ui/uikit';

import {cn} from '../../../../../../utils/cn';
import i18n from '../../i18n';

import illustration from './query-plan-not-enabled.svg';

import './QueryPlanNotEnabled.scss';

const b = cn('ydb-query-plan-not-enabled');

export function QueryPlanNotEnabled({onOpenSettings}: {onOpenSettings: VoidFunction}) {
    return (
        <PlaceholderContainer
            className={b()}
            size="m"
            direction="row"
            title={i18n('title_query-plan-not-enabled')}
            description={i18n('context_query-plan-not-enabled')}
            image={<Icon data={illustration} width={150} height={150} aria-hidden />}
            actions={[{text: i18n('action_open-query-settings'), onClick: onOpenSettings}]}
        />
    );
}
