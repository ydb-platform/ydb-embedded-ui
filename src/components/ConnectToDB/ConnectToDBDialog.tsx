import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog, Tabs} from '@gravity-ui/uikit';

import {cn} from '../../utils/cn';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {YDBSyntaxHighlighterLazy} from '../SyntaxHighlighter/lazy';

import {getDocsLink} from './getDocsLink';
import i18n from './i18n';
import {getSnippetCode} from './snippets';
import type {SnippetLanguage, SnippetParams} from './types';

import './ConnectToDB.scss';

const b = cn('ydb-connect-to-db');

const connectionTabs: {id: SnippetLanguage; title: string}[] = [
    {id: 'bash', title: 'Bash'},
    {id: 'cpp', title: 'C++'},
    {id: 'csharp', title: 'C# (.NET)'},
    {id: 'go', title: 'Go'},
    {id: 'java', title: 'Java'},
    {id: 'javascript', title: 'Node JS'},
    {id: 'php', title: 'PHP'},
    {id: 'python', title: 'Python'},
];

interface ConnectToDBDialogProps extends SnippetParams {
    open: boolean;
    onClose: VoidFunction;
}

function ConnectToDBDialog({open, onClose, database, endpoint}: ConnectToDBDialogProps) {
    const [activeTab, setActiveTab] = React.useState<SnippetLanguage>('bash');

    const snippet = getSnippetCode(activeTab, {database, endpoint});
    const docsLink = getDocsLink(activeTab);

    return (
        <Dialog open={open} hasCloseButton={true} onClose={onClose} size="l">
            <Dialog.Header caption={i18n('header')} />
            <Dialog.Body>
                <div>{i18n('connection-info-message')}</div>
                <Tabs
                    size="m"
                    allowNotSelected={false}
                    activeTab={activeTab}
                    items={connectionTabs}
                    onSelectTab={(tab) => setActiveTab(tab as SnippetLanguage)}
                    className={b('dialog-tabs')}
                />
                <div className={b('snippet-container')}>
                    <YDBSyntaxHighlighterLazy
                        language={activeTab}
                        text={snippet}
                        transparentBackground={false}
                        withCopy
                    />
                </div>
                {docsLink ? (
                    <LinkWithIcon
                        className={b('docs')}
                        title={i18n('documentation')}
                        url={docsLink}
                    />
                ) : null}
            </Dialog.Body>
            <Dialog.Footer onClickButtonCancel={onClose} textButtonCancel={i18n('close')} />
        </Dialog>
    );
}

const ConnectToDBDialogNiceModal = NiceModal.create((props: SnippetParams) => {
    const modal = NiceModal.useModal();

    const handleClose = () => {
        modal.hide();
        modal.remove();
    };

    return (
        <ConnectToDBDialog
            {...props}
            onClose={() => {
                modal.resolve(false);
                handleClose();
            }}
            open={modal.visible}
        />
    );
});

const CONNECT_TO_DB_DIALOG = 'connect-to-db-dialog';

NiceModal.register(CONNECT_TO_DB_DIALOG, ConnectToDBDialogNiceModal);

export async function getConnectToDBDialog(params: SnippetParams): Promise<boolean> {
    return await NiceModal.show(CONNECT_TO_DB_DIALOG, {
        id: CONNECT_TO_DB_DIALOG,
        ...params,
    });
}
