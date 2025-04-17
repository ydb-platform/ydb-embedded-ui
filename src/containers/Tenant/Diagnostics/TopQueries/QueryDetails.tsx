import React from 'react';

import {Code, Link, Xmark} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import EnableFullscreenButton from '../../../../components/EnableFullscreenButton/EnableFullscreenButton';
import Fullscreen from '../../../../components/Fullscreen/Fullscreen';
import type {InfoViewerItem} from '../../../../components/InfoViewer';
import {InfoViewer} from '../../../../components/InfoViewer';
import {YDBSyntaxHighlighter} from '../../../../components/SyntaxHighlighter/YDBSyntaxHighlighter';
import {cn} from '../../../../utils/cn';

import i18n from './i18n';

import './QueryDetails.scss';

const b = cn('kv-query-details');

interface QueryDetailsProps {
    queryText: string;
    infoItems: InfoViewerItem[];
    onClose: () => void;
    onOpenInEditor: () => void;
    onCopyLink?: () => void;
}

export const QueryDetails = ({
    queryText,
    infoItems,
    onClose,
    onOpenInEditor,
    onCopyLink,
}: QueryDetailsProps) => {
    const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

    // Function to copy current URL to clipboard
    const copyLinkToClipboard = (e: React.MouseEvent) => {
        e.stopPropagation();

        setIsTooltipOpen(true);
        // If onCopyLink is provided, call it to generate and copy a shareable URL
        // The actual copy to clipboard is handled in the parent component
        if (onCopyLink) {
            onCopyLink();
        }

        setTimeout(() => {
            setIsTooltipOpen(false);
        }, 1000);
    };

    return (
        <div className={b()}>
            <div className={b('header')}>
                <div className={b('title')}>Query</div>
                <div className={b('actions')}>
                    {onCopyLink && (
                        <ActionTooltip
                            disabled={!isTooltipOpen}
                            closeDelay={1000}
                            title={i18n('query-details.link-copied')}
                        >
                            <Button
                                view="flat-secondary"
                                onClick={copyLinkToClipboard}
                                title={i18n('query-details.copy-link')}
                            >
                                <Icon data={Link} size={16} />
                            </Button>
                        </ActionTooltip>
                    )}
                    <EnableFullscreenButton />
                    <Button view="flat-secondary" onClick={onClose}>
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
            </div>

            <Fullscreen>
                <div className={b('content')}>
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
                </div>
            </Fullscreen>
        </div>
    );
};
