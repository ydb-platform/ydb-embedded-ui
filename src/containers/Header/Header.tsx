import React from 'react';

import {ArrowUpRightFromSquare, PlugConnection} from '@gravity-ui/icons';
import {Breadcrumbs, Button, Divider, Flex, Icon} from '@gravity-ui/uikit';
import {useLocation} from 'react-router-dom';

import {getConnectToDBDialog} from '../../components/ConnectToDB/ConnectToDBDialog';
import {InternalLink} from '../../components/InternalLink';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {cn} from '../../utils/cn';
import {DEVELOPER_UI_TITLE} from '../../utils/constants';
import {createDeveloperUIInternalPageHref} from '../../utils/developerUI/developerUI';
import {useTypedSelector} from '../../utils/hooks';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';

import type {RawBreadcrumbItem} from './breadcrumbs';
import {getBreadcrumbs} from './breadcrumbs';
import {headerKeyset} from './i18n';

import './Header.scss';

const b = cn('header');

interface HeaderProps {
    mainPage?: RawBreadcrumbItem;
}

function Header({mainPage}: HeaderProps) {
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

    const clusterInfo = useClusterBaseInfo();

    const database = useDatabaseFromQuery();
    const location = useLocation();
    const isDatabasePage = location.pathname === '/tenant';

    const clusterName = clusterInfo.title || clusterInfo.name;

    const breadcrumbItems = React.useMemo(() => {
        const rawBreadcrumbs: RawBreadcrumbItem[] = [];
        let options = pageBreadcrumbsOptions;

        if (mainPage) {
            rawBreadcrumbs.push(mainPage);
        }

        if (clusterName) {
            options = {
                ...options,
                clusterName,
            };
        }

        const breadcrumbs = getBreadcrumbs(page, options, rawBreadcrumbs);

        return breadcrumbs.map((item) => {
            return {...item, action: () => {}};
        });
    }, [clusterName, mainPage, page, pageBreadcrumbsOptions]);

    const renderRightControls = () => {
        const elements: React.ReactNode[] = [];

        if (isDatabasePage && database) {
            elements.push(
                <Button view={'flat'} onClick={() => getConnectToDBDialog({database})}>
                    <Icon data={PlugConnection} />
                    {headerKeyset('connect')}
                </Button>,
            );
        }

        if (isUserAllowedToMakeChanges) {
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
                <Breadcrumbs
                    items={breadcrumbItems}
                    lastDisplayedItemsCount={1}
                    firstDisplayedItemsCount={1}
                    className={b('breadcrumbs')}
                    renderItem={({item, isCurrent}) => {
                        const {icon, text, link} = item;

                        return (
                            <InternalLink
                                className={b('breadcrumbs-item', {
                                    active: isCurrent,
                                    link: !isCurrent,
                                })}
                                to={isCurrent ? undefined : link}
                            >
                                {icon ? (
                                    <span className={b('breadcrumbs-icon')}>{icon}</span>
                                ) : null}
                                <span>{text}</span>
                            </InternalLink>
                        );
                    }}
                />

                {renderRightControls()}
            </header>
        );
    };
    return renderHeader();
}

export default Header;
