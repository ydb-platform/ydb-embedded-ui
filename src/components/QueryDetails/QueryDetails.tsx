import {Code} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {YDBSyntaxHighlighter} from '../SyntaxHighlighter/YDBSyntaxHighlighter';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import i18n from './i18n';

import './QueryDetails.scss';

const b = cn('ydb-query-details');

interface QueryDetailsProps {
    queryText: string;
    infoItems?: YDBDefinitionListItem[];
    onOpenInEditor: () => void;
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

                <div className={b('query-content')}>
                    <div className={b('query-header')}>
                        <div className={b('query-title')}>{i18n('title_query-details')}</div>
                        <Button
                            view="flat-secondary"
                            size="m"
                            onClick={onOpenInEditor}
                            className={b('editor-button')}
                        >
                            <Icon data={Code} size={16} />
                            {i18n('action_open-in-editor')}
                        </Button>
                    </div>
                    <YDBSyntaxHighlighter
                        language="yql"
                        text={queryText}
                        withClipboardButton={{alwaysVisible: true, withLabel: false, size: 'm'}}
                    />
                </div>
            </Flex>
        </Flex>
    );
};
