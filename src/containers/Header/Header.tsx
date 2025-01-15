import React from 'react';

import {Breadcrumbs} from '@gravity-ui/uikit';

import {InternalLink} from '../../components/InternalLink';
import {LinkWithIcon} from '../../components/LinkWithIcon/LinkWithIcon';
import {selectIsUserAllowedToMakeChanges} from '../../store/reducers/authentication/authentication';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {cn} from '../../utils/cn';
import {DEVELOPER_UI_TITLE} from '../../utils/constants';
import {createDeveloperUIInternalPageHref} from '../../utils/developerUI/developerUI';
import {useTypedSelector} from '../../utils/hooks';

import type {RawBreadcrumbItem} from './breadcrumbs';
import {getBreadcrumbs} from './breadcrumbs';

import './Header.scss';

const b = cn('header');

interface HeaderProps {
    mainPage?: RawBreadcrumbItem;
}

function Header({mainPage}: HeaderProps) {
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);
    const isUserAllowedToMakeChanges = useTypedSelector(selectIsUserAllowedToMakeChanges);

    const clusterInfo = useClusterBaseInfo();

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

                {isUserAllowedToMakeChanges ? (
                    <LinkWithIcon
                        title={DEVELOPER_UI_TITLE}
                        url={createDeveloperUIInternalPageHref()}
                    />
                ) : null}
            </header>
        );
    };
    return renderHeader();
}

export default Header;
