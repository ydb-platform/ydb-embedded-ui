import React from 'react';

import {useThemeValue} from '@gravity-ui/uikit';

import NotRenderUntilFirstVisible from '../../../components/NotRenderUntilFirstVisible/NotRenderUntilFirstVisible';
import {TENANT_PAGES_IDS} from '../../../store/reducers/tenant/constants';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../types/additionalProps';
import type {EPathType} from '../../../types/api/schema';
import {cn} from '../../../utils/cn';
import {useTypedSelector} from '../../../utils/hooks';
import Diagnostics from '../Diagnostics/Diagnostics';
import {Query} from '../Query/Query';
import {TenantNavigation} from '../TenantNavigation/TenantNavigation';

import './ObjectGeneral.scss';

const b = cn('object-general');

interface ObjectGeneralProps {
    type?: EPathType;
    tenantName: string;
    path: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

function ObjectGeneral(props: ObjectGeneralProps) {
    const theme = useThemeValue();

    const {tenantPage} = useTypedSelector((state) => state.tenant);

    const renderPageContent = () => {
        const {type, additionalTenantProps, additionalNodesProps, tenantName, path} = props;

        return (
            <React.Fragment>
                <NotRenderUntilFirstVisible show={tenantPage === TENANT_PAGES_IDS.query}>
                    <Query tenantName={tenantName} path={path} theme={theme} type={type} />
                </NotRenderUntilFirstVisible>
                <NotRenderUntilFirstVisible show={tenantPage === TENANT_PAGES_IDS.diagnostics}>
                    <Diagnostics
                        type={type}
                        tenantName={tenantName}
                        path={path}
                        additionalTenantProps={additionalTenantProps}
                        additionalNodesProps={additionalNodesProps}
                    />
                </NotRenderUntilFirstVisible>
            </React.Fragment>
        );
    };

    return (
        <div className={b()}>
            <TenantNavigation />
            {renderPageContent()}
        </div>
    );
}

export default ObjectGeneral;
