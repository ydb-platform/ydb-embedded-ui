import React from 'react';

import {Drawer, DrawerItem} from '@gravity-ui/navigation';
import {useHistory, useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../routes';
import {changeUserInput, setIsDirty} from '../../../../store/reducers/query/query';
import {
    TENANT_PAGE,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
} from '../../../../store/reducers/tenant/constants';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';
import {useTypedDispatch} from '../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../TenantPages';

import {QueryDetails} from './QueryDetails';
import {createQueryInfoItems} from './utils';

const DEFAULT_DRAWER_WIDTH = 600;
const DRAWER_WIDTH_KEY = 'kv-top-queries-drawer-width';
const b = cn('kv-top-queries');

interface QueryDetailsDrawerProps {
    row: KeyValueRow | null;
    onClose: () => void;
}

export const QueryDetailsDrawer = ({row, onClose}: QueryDetailsDrawerProps) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [drawerWidth, setDrawerWidth] = React.useState(() => {
        const savedWidth = localStorage.getItem(DRAWER_WIDTH_KEY);
        return savedWidth ? Number(savedWidth) : DEFAULT_DRAWER_WIDTH;
    });

    // Effect to open drawer when row changes
    React.useEffect(() => {
        if (row) {
            setIsVisible(true);
        }
    }, [row]);

    const handleClose = () => {
        setIsVisible(false);
        onClose();
    };

    const dispatch = useTypedDispatch();
    const location = useLocation();
    const history = useHistory();

    const handleOpenInEditor = React.useCallback(() => {
        if (row) {
            const input = row.QueryText as string;
            dispatch(changeUserInput({input}));
            dispatch(setIsDirty(false));

            const queryParams = parseQuery(location);

            const queryPath = getTenantPath({
                ...queryParams,
                [TENANT_PAGE]: TENANT_PAGES_IDS.query,
                [TenantTabsGroups.queryTab]: TENANT_QUERY_TABS_ID.newQuery,
            });

            history.push(queryPath);
        }
    }, [dispatch, history, location, row]);

    const handleResizeDrawer = (width: number) => {
        setDrawerWidth(width);
        localStorage.setItem(DRAWER_WIDTH_KEY, width.toString());
    };

    return (
        <Drawer
            onEscape={handleClose}
            onVeilClick={handleClose}
            hideVeil
            className={b('drawer-container')}
        >
            <DrawerItem
                id="query-details"
                visible={isVisible}
                resizable
                width={drawerWidth}
                onResize={handleResizeDrawer}
                direction="right"
                className={b('drawer-item')}
            >
                {row && (
                    <QueryDetails
                        queryText={row.QueryText as string}
                        infoItems={createQueryInfoItems(row)}
                        onClose={handleClose}
                        onOpenInEditor={handleOpenInEditor}
                    />
                )}
            </DrawerItem>
        </Drawer>
    );
};
