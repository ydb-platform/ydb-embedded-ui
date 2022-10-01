import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {Button, Modal} from '@gravity-ui/uikit';

import type {EPathType} from '../../../../types/api/schema';
//@ts-ignore
import Icon from '../../../../components/Icon/Icon';
import Overview from '../Overview/Overview';
import {Healthcheck} from '../Healthcheck';
//@ts-ignore
import TenantOverview from '../TenantOverview/TenantOverview';

import './DetailedOverview.scss';

interface DetailedOverviewProps {
    type?: EPathType;
    className?: string;
    tenantName: string;
    additionalTenantInfo?: any;
}

const b = cn('kv-detailed-overview');

function DetailedOverview(props: DetailedOverviewProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const {
        currentSchemaPath,
    } = useSelector((state: any) => state.schema);

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
                    title='Close'
                >
                    <Icon name="close" viewBox={'0 0 16 16 '} height={20} width={20} />
                </Button>
            </Modal>
        );
    };

    const renderContent = () => {
        const {type, tenantName, additionalTenantInfo} = props;
        const isTenant = tenantName === currentSchemaPath;
        return (
            <div className={b()}>
                {isTenant ? (
                    <>
                        <div className={b('section')}>
                            <TenantOverview tenantName={tenantName} additionalTenantInfo={additionalTenantInfo} />
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
