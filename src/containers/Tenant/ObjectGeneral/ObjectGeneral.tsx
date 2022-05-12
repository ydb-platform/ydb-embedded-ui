import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import cn from 'bem-cn-lite';
import {useLocation} from 'react-router';
import qs from 'qs';
import _ from 'lodash';

import {Tabs, useThemeValue} from '@yandex-cloud/uikit';
//@ts-ignore
import QueryEditor from '../QueryEditor/QueryEditor';
import Diagnostics from '../Diagnostics/Diagnostics';

import {TenantGeneralTabsIds, TenantTabsGroups, TENANT_GENERAL_TABS} from '../TenantPages';
import routes, {createHref} from '../../../routes';
import {setSettingValue} from '../../../store/reducers/settings';
import {TENANT_INITIAL_TAB_KEY} from '../../../utils/constants';

import './ObjectGeneral.scss';

const b = cn('object-general');

type ObjectGeneralProps = {
    type: string;
    additionalTenantInfo?: any;
    additionalNodesInfo?: any;
} & typeof mapDispatchToProps;

function ObjectGeneral(props: ObjectGeneralProps) {
    const location = useLocation();

    const theme = useThemeValue();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name: tenantName, general: generalTab} = queryParams;

    const renderTabs = () => {
        const pages = TENANT_GENERAL_TABS.map((page) => {
            return {
                ...page,
                title: (
                    <div className={b('tab-label')}>
                        {page.icon}
                        {page.title}
                    </div>
                ),
            };
        });
        return (
            <div className={b('tabs')}>
                <Tabs
                    items={pages}
                    activeTab={generalTab as string}
                    wrapTo={({id}, node) => {
                        const path = createHref(routes.tenant, undefined, {
                            ...queryParams,
                            name: tenantName as string,
                            [TenantTabsGroups.general]: id,
                        });
                        return (
                            <Link to={path} key={id} className={b('tab')}>
                                {node}
                            </Link>
                        );
                    }}
                    allowNotSelected
                    onSelectTab={(id) => props.setSettingValue(TENANT_INITIAL_TAB_KEY, id)}
                />
            </div>
        );
    };

    const renderTabContent = () => {
        const {type, additionalTenantInfo, additionalNodesInfo} = props;
        switch (generalTab) {
            case TenantGeneralTabsIds.query: {
                return <QueryEditor path={tenantName as string} theme={theme} type={type} />;
            }
            default: {
                return (
                    <Diagnostics
                        type={type}
                        additionalTenantInfo={additionalTenantInfo}
                        additionalNodesInfo={additionalNodesInfo}
                    />
                );
            }
        }
    };

    const renderContent = () => {
        if (!tenantName) {
            return null;
        }
        return (
            <div className={b()}>
                {renderTabs()}
                {renderTabContent()}
            </div>
        );
    };

    return renderContent();
}

const mapDispatchToProps = {
    setSettingValue,
};

export default connect(null, mapDispatchToProps)(ObjectGeneral);
