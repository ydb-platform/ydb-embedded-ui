import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {Button, Modal} from '@gravity-ui/uikit';

import type {EPathType} from '../../../../types/api/schema';
import type {AdditionalTenantsProps} from '../../../../types/additionalProps';
import {Icon} from '../../../../components/Icon';
import Overview from '../Overview/Overview';
import {Healthcheck} from '../Healthcheck';
import {TenantOverview} from '../TenantOverview/TenantOverview';

import './DetailedOverview.scss';

interface DetailedOverviewProps {
    type?: EPathType;
    className?: string;
    tenantName: string;
    additionalTenantProps?: AdditionalTenantsProps;
}

const b = cn('kv-detailed-overview');

function DetailedOverview(props: DetailedOverviewProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const {currentSchemaPath} = useSelector((state: any) => state.schema);

    const openModalHandler = () => {
        setIsModalVisible(true);
    };

    const closeModalHandler = () => {
        setIsModalVisible(false);
    };

    const renderModal = () => {
        return (
            <Modal open={isModalVisible} onClose={closeModalHandler} className={b('modal')}>
                <Healthcheck tenant={props.tenantName} fetchData={false} />
                <Button
                    className={b('close-modal-button')}
                    onClick={closeModalHandler}
                    view="flat-secondary"
                    title="Close"
                >
                    <Icon name="close" viewBox={'0 0 16 16 '} height={20} width={20} />
                </Button>
            </Modal>
        );
    };

    const renderContent = () => {
        const {type, tenantName, additionalTenantProps} = props;
        const isTenant = tenantName === currentSchemaPath;
        return (
            <div className={b()}>
                {isTenant ? (
                    <>
                        <div className={b('section')}>
                            <TenantOverview
                                tenantName={tenantName}
                                additionalTenantProps={additionalTenantProps}
                            />
                        </div>
                        <div className={b('section')}>
                            <Healthcheck
                                tenant={tenantName}
                                preview={true}
                                showMoreHandler={openModalHandler}
                            />
                        </div>
                    </>
                ) : (
                    <Overview type={type} tenantName={tenantName} />
                )}
            </div>
        );
    };

    return (
        <React.Fragment>
            {renderContent()}
            {renderModal()}
        </React.Fragment>
    );
}

export default DetailedOverview;
