import React from 'react';

import {ArrowUpRightFromSquare, CirclePlus, PlugConnection} from '@gravity-ui/icons';
import {Breadcrumbs, Button, Divider, Flex, Icon} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import {InternalLink} from '../../components/InternalLink';
import {useAddClusterFeatureAvailable} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {DEVELOPER_UI_TITLE} from '../../utils/constants';
import {createDeveloperUIInternalPageHref} from '../../utils/developerUI/developerUI';
import {useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';

import {getBreadcrumbs} from './breadcrumbs';
import {headerKeyset} from './i18n';

import './Header.scss';

const b = cn('header');

function Header() {
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const {title: clusterTitle} = useClusterBaseInfo();

    const database = useDatabaseFromQuery();
    const location = useLocation();
    const isDatabasePage = location.pathname === '/tenant';
    const isClustersPage = location.pathname === '/clusters';

    const isAddClusterAvailable =
        useAddClusterFeatureAvailable() && uiFactory.onAddCluster !== undefined;

    const breadcrumbItems = React.useMemo(() => {
        let options = {...pageBreadcrumbsOptions, singleClusterMode};

        if (clusterTitle) {
            options = {
                ...options,
                clusterName: clusterTitle,
            };
        }

        const breadcrumbs = getBreadcrumbs(page, options);

        return breadcrumbs.map((item) => {
            return {...item, action: () => {}};
        });
    }, [clusterTitle, page, pageBreadcrumbsOptions, singleClusterMode]);

    const renderRightControls = () => {
        const elements: React.ReactNode[] = [];

        if (isClustersPage && isAddClusterAvailable) {
            elements.push(
                <Button view={'flat'} onClick={() => uiFactory.onAddCluster?.()}>
                    <Icon data={CirclePlus} />
                    {headerKeyset('add-cluster')}
                </Button>,
            );
        }

        if (isDatabasePage && database) {
            elements.push(
                <Button view={'flat'} onClick={() => getConnectToDBDialog({database})}>
                    <Icon data={PlugConnection} />
                    {headerKeyset('connect')}
                </Button>,
            );
        }

        if (!isClustersPage && isUserAllowedToMakeChanges) {
            elements.push(
                <Button view="flat" href={createDeveloperUIInternalPageHref()} target="_blank">
                    {DEVELOPER_UI_TITLE}
                    <Icon data={ArrowUpRightFromSquare} />
                </Button>,
            );
        }

        if (elements.length) {
            return (
                <Flex direction="row" gap={1}>
                    {elements.map((el, index) => {
                        return (
                            <React.Fragment key={index}>
                                {el}
                                {index === elements.length - 1 ? null : (
                                    <Divider orientation="vertical" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </Flex>
            );
        }

        return null;
    };

    const renderHeader = () => {
        return (
            <header className={b()}>
                <Breadcrumbs className={b('breadcrumbs')}>
                    {breadcrumbItems.map((item, index) => {
                        const {icon, text, link} = item;
                        const isLast = index === breadcrumbItems.length - 1;

                        return (
                            <Breadcrumbs.Item
                                key={index}
                                className={b('breadcrumbs-item', {active: isLast})}
                                disabled={isLast}
                            >
                                <InternalLink to={isLast ? undefined : link} as="tab">
                                    <Flex alignItems="center" gap={1}>
                                        {icon}
                                        {text}
                                    </Flex>
                                </InternalLink>
                            </Breadcrumbs.Item>
                        );
                    })}
                </Breadcrumbs>

                {renderRightControls()}
            </header>
        );
    };
    return renderHeader();
}

export default Header;
