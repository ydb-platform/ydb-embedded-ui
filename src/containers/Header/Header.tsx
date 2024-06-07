import React from 'react';

import type {BreadcrumbsItem} from '@gravity-ui/uikit';
import {Breadcrumbs} from '@gravity-ui/uikit';
import {useHistory, useLocation} from 'react-router';

import {LinkWithIcon} from '../../components/LinkWithIcon/LinkWithIcon';
import {parseQuery} from '../../routes';
import {backend, customBackend} from '../../store';
import {clusterApi} from '../../store/reducers/cluster/cluster';
import {cn} from '../../utils/cn';
import {DEVELOPER_UI_TITLE} from '../../utils/constants';
import {useTypedSelector} from '../../utils/hooks';

import type {RawBreadcrumbItem} from './breadcrumbs';
import {getBreadcrumbs} from './breadcrumbs';

import './Header.scss';

const b = cn('header');

const getInternalLink = (singleClusterMode: boolean) => {
    if (singleClusterMode && !customBackend) {
        return `/internal`;
    }

    return backend + '/internal';
};

interface HeaderProps {
    mainPage?: RawBreadcrumbItem;
}

function Header({mainPage}: HeaderProps) {
    const history = useHistory();
    const location = useLocation();

    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);

    const queryParams = parseQuery(location);

    const clusterNameFromQuery = queryParams.clusterName?.toString();
    const {currentData: {clusterData: data} = {}} =
        clusterApi.useGetClusterInfoQuery(clusterNameFromQuery);

    const clusterNameFinal = data?.Name || clusterNameFromQuery;

    const breadcrumbItems = React.useMemo(() => {
        const rawBreadcrumbs: RawBreadcrumbItem[] = [];
        let options = pageBreadcrumbsOptions;

        if (mainPage) {
            rawBreadcrumbs.push(mainPage);
        }

        if (clusterNameFinal) {
            options = {
                ...pageBreadcrumbsOptions,
                clusterName: clusterNameFinal,
            };
        }

        const breadcrumbs = getBreadcrumbs(page, options, rawBreadcrumbs, queryParams);

        return breadcrumbs.map((item) => {
            const action: BreadcrumbsItem['action'] = (event) => {
                if (!item.link) return;
                event.preventDefault();
                event.stopPropagation();

                // should we handle it for Windows ctrl key? (meta is CMD for mac and is WIN key for windows)
                if (event.metaKey) {
                    window.open(item.link, '_blank');
                } else history.push(item.link);
            };
            return {...item, action};
        });
    }, [clusterNameFinal, mainPage, history, queryParams, page, pageBreadcrumbsOptions]);

    const renderHeader = () => {
        return (
            <header className={b()}>
                <div>
                    <Breadcrumbs
                        items={breadcrumbItems}
                        lastDisplayedItemsCount={1}
                        firstDisplayedItemsCount={1}
                        renderItemContent={({icon, text}) => {
                            if (!icon) {
                                return text;
                            }
                            return (
                                <span className={b('breadcrumb')}>
                                    <div className={b('breadcrumb__icon')}>{icon}</div>
                                    {text}
                                </span>
                            );
                        }}
                    />
                </div>

                <LinkWithIcon title={DEVELOPER_UI_TITLE} url={getInternalLink(singleClusterMode)} />
            </header>
        );
    };
    return renderHeader();
}

export default Header;
