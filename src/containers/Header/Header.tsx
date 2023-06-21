import {useEffect, useMemo} from 'react';
import {useHistory, useLocation} from 'react-router';
import {useDispatch} from 'react-redux';
import block from 'bem-cn-lite';

import {Breadcrumbs, Icon} from '@gravity-ui/uikit';

import {ExternalLinkWithIcon} from '../../components/ExternalLinkWithIcon/ExternalLinkWithIcon';

import {backend, customBackend} from '../../store';
import {getClusterInfo} from '../../store/reducers/cluster/cluster';
import {useTypedSelector} from '../../utils/hooks';
import {DEVELOPER_UI} from '../../utils/constants';
import {parseQuery} from '../../routes';

import {RawBreadcrumbItem, getBreadcrumbs} from './breadcrumbs';

import './Header.scss';

const b = block('header');

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
    const dispatch = useDispatch();
    const history = useHistory();
    const location = useLocation();

    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);
    const {data} = useTypedSelector((state) => state.cluster);

    const queryParams = parseQuery(location);

    const clusterNameFromQuery = queryParams.clusterName?.toString();

    const clusterNameFinal = data?.Name || clusterNameFromQuery;

    useEffect(() => {
        dispatch(getClusterInfo(clusterNameFromQuery));
    }, [dispatch, clusterNameFromQuery]);

    const breadcrumbItems = useMemo(() => {
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
            const action = () => {
                if (item.link) {
                    history.push(item.link);
                }
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
                                    <Icon
                                        width={16}
                                        height={16}
                                        data={icon}
                                        className={b('breadcrumb__icon')}
                                    />
                                    {text}
                                </span>
                            );
                        }}
                    />
                </div>

                <ExternalLinkWithIcon
                    title={DEVELOPER_UI}
                    url={getInternalLink(singleClusterMode)}
                />
            </header>
        );
    };
    return renderHeader();
}

export default Header;
