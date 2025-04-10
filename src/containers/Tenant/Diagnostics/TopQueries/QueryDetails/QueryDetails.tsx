import React from 'react';

import {Code, Xmark} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';

import Fullscreen from '../../../../../components/Fullscreen/Fullscreen';
import type {InfoViewerItem} from '../../../../../components/InfoViewer';
import {InfoViewer} from '../../../../../components/InfoViewer';
import {YDBSyntaxHighlighter} from '../../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import {CopyLinkButton} from './CopyLinkButton';

import './QueryDetails.scss';

const b = cn('kv-query-details');

interface QueryDetailsProps {
    queryText: string;
    infoItems: InfoViewerItem[];
    onClose: () => void;
    onOpenInEditor: () => void;
    getTopQueryUrl?: () => string;
}

export const QueryDetails = ({
    queryText,
    infoItems,
    onClose,
    onOpenInEditor,
    getTopQueryUrl,
}: QueryDetailsProps) => {
    const topQueryUrl = React.useMemo(() => getTopQueryUrl?.(), [getTopQueryUrl]);

    return (
        <div className={b()}>
            <div className={b('header')}>
                <div className={b('title')}>Query</div>
                <div className={b('actions')}>
                    {topQueryUrl && <CopyLinkButton text={topQueryUrl} />}
                    <Button view="flat-secondary" onClick={onClose}>
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
            </div>

            <Fullscreen>
                <Flex direction="column" className={b('content')}>
                    <InfoViewer info={infoItems} />

                    <div className={b('query-content')}>
                        <div className={b('query-header')}>
                            <div className={b('query-title')}>
                                {i18n('query-details.query.title')}
                            </div>
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
            </Fullscreen>
        </div>
    );
};
