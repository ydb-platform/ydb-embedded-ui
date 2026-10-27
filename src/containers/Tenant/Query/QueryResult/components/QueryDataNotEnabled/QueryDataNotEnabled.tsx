import {Icon, PlaceholderContainer} from '@gravity-ui/uikit';

import {cn} from '../../../../../../utils/cn';
import i18n from '../../i18n';

import illustration from './query-data-not-enabled.svg';

import './QueryDataNotEnabled.scss';

const b = cn('ydb-query-data-not-enabled');

interface QueryDataNotEnabledProps {
    kind: 'plan' | 'stats';
    onOpenSettings: VoidFunction;
}

export function QueryDataNotEnabled({kind, onOpenSettings}: QueryDataNotEnabledProps) {
    return (
        <PlaceholderContainer
            className={b()}
            size="m"
            direction="row"
            title={i18n(
                kind === 'plan' ? 'title_query-plan-not-enabled' : 'title_statistics-not-enabled',
            )}
            description={i18n(
                kind === 'plan'
                    ? 'context_query-plan-not-enabled'
                    : 'context_statistics-not-enabled',
            )}
            image={<Icon data={illustration} width={150} height={150} aria-hidden />}
            actions={[{text: i18n('action_open-query-settings'), onClick: onOpenSettings}]}
        />
    );
}
