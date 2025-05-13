import {Code} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';

import type {InfoViewerItem} from '../../../../../components/InfoViewer';
import {InfoViewer} from '../../../../../components/InfoViewer';
import {YDBSyntaxHighlighter} from '../../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import './QueryDetails.scss';

const b = cn('ydb-query-details');

interface QueryDetailsProps {
    queryText: string;
    infoItems: InfoViewerItem[];
    onOpenInEditor: () => void;
}

export const QueryDetails = ({queryText, infoItems, onOpenInEditor}: QueryDetailsProps) => {
    return (
        <Flex direction="column" className={b()}>
            <Flex direction="column" className={b('content')}>
                <InfoViewer info={infoItems} />

                <div className={b('query-content')}>
                    <div className={b('query-header')}>
                        <div className={b('query-title')}>{i18n('query-details.query.title')}</div>
                        <Button
                            view="flat-secondary"
                            size="m"
                            onClick={onOpenInEditor}
                            className={b('editor-button')}
                        >
                            <Icon data={Code} size={16} />
                            {i18n('query-details.open-in-editor')}
                        </Button>
                    </div>
                    <YDBSyntaxHighlighter
                        language="yql"
                        text={queryText}
                        withClipboardButton={{alwaysVisible: true, withLabel: false}}
                    />
                </div>
            </Flex>
        </Flex>
    );
};
