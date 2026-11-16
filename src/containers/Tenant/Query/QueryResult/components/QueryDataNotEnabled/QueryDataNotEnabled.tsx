import {PlaceholderContainer, Text} from '@gravity-ui/uikit';

import {cn} from '../../../../../../utils/cn';
import {getIllustration} from '../../../../../../utils/illustrations';
import i18n from '../../i18n';

import './QueryDataNotEnabled.scss';

const b = cn('ydb-query-data-not-enabled');

interface QueryDataNotEnabledProps {
    kind: 'plan' | 'stats';
    onOpenSettings: VoidFunction;
}

export function QueryDataNotEnabled({kind, onOpenSettings}: QueryDataNotEnabledProps) {
    const NoSearchResultsImage = getIllustration('NoSearchResults');
    const description = i18n(
        kind === 'plan' ? 'context_query-plan-not-enabled' : 'context_statistics-not-enabled',
    );

    return (
        <PlaceholderContainer
            className={b()}
            size="m"
            direction="row"
            title={i18n(
                kind === 'plan' ? 'title_query-plan-not-enabled' : 'title_statistics-not-enabled',
            )}
            description={
                <Text as="div" variant="body-1" className={b('description')}>
                    {description
                        .split('**')
                        .map((text, index) =>
                            index % 2 ? <strong key={index}>{text}</strong> : text,
                        )}
                </Text>
            }
            image={<NoSearchResultsImage width={150} height={150} aria-hidden />}
            actions={[{text: i18n('action_open-query-settings'), onClick: onOpenSettings}]}
        />
    );
}
