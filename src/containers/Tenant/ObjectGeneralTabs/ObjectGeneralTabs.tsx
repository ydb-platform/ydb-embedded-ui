import qs from 'qs';
import {connect} from 'react-redux';
import {useLocation} from 'react-router';
import {Link} from 'react-router-dom';
import cn from 'bem-cn-lite';

import {Tabs} from '@gravity-ui/uikit';

import routes, {createHref} from '../../../routes';
import {TENANT_INITIAL_TAB_KEY} from '../../../utils/constants';
import {setSettingValue} from '../../../store/reducers/settings/settings';

import {TenantTabsGroups, TENANT_GENERAL_TABS} from '../TenantPages';

import './ObjectGeneralTabs.scss';

const b = cn('object-general-tabs');

interface ObjectGeneralTabsProps {
    setSettingValue: (name: string, value: string) => void;
}

function ObjectGeneralTabs(props: ObjectGeneralTabsProps) {
    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const {name: tenantName, general: generalTab} = queryParams;

    const renderContent = () => {
        if (!tenantName) {
            return null;
        }
        return (
            <div className={b()}>
                <Tabs
                    size="xl"
                    items={TENANT_GENERAL_TABS}
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

    return renderContent();
}

const mapDispatchToProps = {
    setSettingValue,
};

export default connect(null, mapDispatchToProps)(ObjectGeneralTabs);
