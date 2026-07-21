import {Code} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {QueryTextPreview} from '../QueryTextPreview/QueryTextPreview';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import i18n from './i18n';

import './QueryDetails.scss';

const b = cn('ydb-query-details');

interface QueryDetailsProps {
    queryText: string;
    infoItems?: YDBDefinitionListItem[];
    onOpenInEditor?: () => void;
}

export const QueryDetails = ({queryText, infoItems, onOpenInEditor}: QueryDetailsProps) => {
    return (
        <Flex direction="column" className={b()}>
            <Flex direction="column" className={b('content')}>
                {infoItems && infoItems.length > 0 && (
                    <YDBDefinitionList
                        items={infoItems}
                        wrapperClassName={b('query-details-info')}
                    />
                )}

                <QueryTextPreview
                    className={b('query-content')}
                    title={i18n('title_query-details')}
                    text={queryText}
                    actions={
                        onOpenInEditor ? (
                            <Button
                                view="flat-secondary"
                                size="m"
                                onClick={onOpenInEditor}
                                className={b('editor-button')}
                            >
                                <Icon data={Code} size={16} />
                                {i18n('action_open-in-editor')}
                            </Button>
                        ) : undefined
                    }
                />
            </Flex>
        </Flex>
    );
};
