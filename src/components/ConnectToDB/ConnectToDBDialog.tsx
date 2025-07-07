import React from 'react';

import NiceModal from '@ebay/nice-modal-react';
import {Dialog, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {skipToken} from '@reduxjs/toolkit/query';

import {tenantApi} from '../../store/reducers/tenant/tenant';
import {cn} from '../../utils/cn';
import {useTypedSelector} from '../../utils/hooks';
import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';
import {LoaderWrapper} from '../LoaderWrapper/LoaderWrapper';
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

function ConnectToDBDialog({
    open,
    onClose,
    database,
    endpoint: endpointFromProps,
}: ConnectToDBDialogProps) {
    const [activeTab, setActiveTab] = React.useState<SnippetLanguage>('bash');

    const clusterName = useClusterNameFromQuery();
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    // If there is endpoint from props, we don't need to request tenant data
    // Also we should not request tenant data if we are in single cluster mode
    // Since there is no ControlPlane data in this case
    const shouldRequestTenantData = database && !endpointFromProps && !singleClusterMode;
    const params = shouldRequestTenantData ? {path: database, clusterName} : skipToken;
    const {currentData: tenantData, isLoading: isTenantDataLoading} =
        tenantApi.useGetTenantInfoQuery(params);
    const endpoint = endpointFromProps ?? tenantData?.ControlPlane?.endpoint;

    const snippet = getSnippetCode(activeTab, {database, endpoint});
    const docsLink = getDocsLink(activeTab);

    return (
        <Dialog open={open} hasCloseButton={true} onClose={onClose} size="l">
            <Dialog.Header caption={i18n('header')} />
            <Dialog.Body>
                <div>{i18n('connection-info-message')}</div>
                <TabProvider value={activeTab}>
                    <TabList className={b('dialog-tabs')}>
                        {connectionTabs.map(({id, title}) => (
                            <Tab key={id} value={id} onClick={() => setActiveTab(id)}>
                                {title}
                            </Tab>
                        ))}
                    </TabList>
                </TabProvider>
                <div className={b('snippet-container')}>
                    <LoaderWrapper loading={isTenantDataLoading}>
                        <YDBSyntaxHighlighterLazy
                            language={activeTab}
                            text={snippet}
                            transparentBackground={false}
                            withClipboardButton={{alwaysVisible: true}}
                        />
                    </LoaderWrapper>
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
