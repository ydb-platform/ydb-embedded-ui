import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import {useHistory, useLocation} from 'react-router';
import {Breadcrumbs, BreadcrumbsItem, Link} from '@gravity-ui/uikit';

import Divider from '../../components/Divider/Divider';
import {Icon} from '../../components/Icon';

import {clusterName as clusterNameLocation, backend, customBackend} from '../../store';
import {getClusterInfo} from '../../store/reducers/cluster';
import {getHostInfo} from '../../store/reducers/host';
import {HeaderItemType} from '../../store/reducers/header';

import './Header.scss';

const b = cn('header');

function ClusterName({name}: {name: string}) {
    return (
        <div className={b('cluster-info')}>
            <div className={b('cluster-info-title')}>cluster</div>
            <div className={b('cluster-info-name')}>{name}</div>
        </div>
    );
}

interface HeaderProps {
    clusterName: string;
}

function Header({clusterName}: HeaderProps) {
    const dispatch = useDispatch();
    const {data: host}: {data: {ClusterName?: string}} = useSelector((state: any) => state.host);
    const {singleClusterMode, header}: {singleClusterMode: boolean; header: HeaderItemType[]} =
        useSelector((state: any) => state);

    const location = useLocation();
    const history = useHistory();

    const {pathname} = location;

    useEffect(() => {
        const isClustersPage = pathname.includes('/clusters');

        if (!isClustersPage && !clusterName && !singleClusterMode) {
            dispatch(getClusterInfo(clusterNameLocation));
        }
        dispatch(getHostInfo());
    }, []);

    const renderHeader = () => {
        const clusterNameFinal = singleClusterMode ? host.ClusterName : clusterName;

        let link = backend + '/internal';

        if (singleClusterMode && !customBackend) {
            link = `/internal`;
        }

        const breadcrumbItems = header.reduce((acc, el) => {
            const action = () => {
                if (el.link) {
                    history.push(el.link);
                }
            };
            acc.push({text: el.text, action});
            return acc;
        }, [] as BreadcrumbsItem[]);

        return (
            <header className={b()}>
                <div>
                    <Breadcrumbs
                        items={breadcrumbItems}
                        lastDisplayedItemsCount={1}
                        firstDisplayedItemsCount={1}
                    />
                </div>

                <div className={b('cluster-name-wrapper')}>
                    <Link href={link} target="_blank">
                        Internal viewer{' '}
                        <Icon name="external" viewBox={'0 0 16 16'} width={16} height={16} />
                    </Link>
                    {clusterNameFinal && (
                        <React.Fragment>
                            <div className={b('divider')}>
                                <Divider />
                            </div>
                            <ClusterName name={clusterNameFinal} />
                        </React.Fragment>
                    )}
                </div>
            </header>
        );
    };
    return renderHeader();
}

export default Header;
