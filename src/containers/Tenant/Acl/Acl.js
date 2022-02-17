import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import _ from 'lodash';
import {connect} from 'react-redux';
import {Loader} from '@yandex-cloud/uikit';
import DataTable from '@yandex-cloud/react-data-table';

import './Acl.scss';

const b = cn('kv-acl');

const TABLE_SETTINGS = {
    displayIndices: false,
    syncHeadOnResize: true,
    stickyHead: DataTable.MOVING,
};
const COLUMN_WIDTH = 140;
const COLUMNS = [
    {
        name: 'AccessType',
        header: 'Access Type',
        sortable: false,
        width: COLUMN_WIDTH,
    },
    {
        name: 'AccessRights',
        header: 'Access Rights',
        render: ({value}) => {
            return _.map(value, (item, index) => {
                return <div key={index}>{item}</div>;
            });
        },
        width: COLUMN_WIDTH,
        sortable: false,
    },
    {
        name: 'Subject',
        sortable: false,
        // eslint-disable-next-line react/display-name
        render: ({value}) => {
            return Acl.prepareLogin(value);
        },
        width: COLUMN_WIDTH,
    },
    {
        name: 'InheritanceType',
        header: 'Inheritance Type',
        render: ({value}) => {
            return _.map(value, (item, index) => {
                return <div key={index}>{item}</div>;
            });
        },
        width: COLUMN_WIDTH,
        sortable: false,
    },
];

class Acl extends React.Component {
    static propTypes = {
        error: PropTypes.string,
        acl: PropTypes.array,
        loading: PropTypes.bool,
    };

    static prepareLogin = (value) => {
        if (value && value.endsWith('@staff') && !value.startsWith('svc_')) {
            const login = value.split('@')[0];
            return login;
        }

        return value;
    };

    renderTable = () => {
        const {acl} = this.props;

        if (!acl) {
            return null;
        }

        return <DataTable columns={COLUMNS} data={acl} settings={TABLE_SETTINGS} />;
    };

    renderOwner = () => {
        const {owner} = this.props;

        if (!owner) {
            return null;
        }

        return (
            <div className={b('owner-container')}>
                <span className={b('owner-label')}>Owner: </span>
                {Acl.prepareLogin(owner)}
            </div>
        );
    };
    renderResult = () => {
        return (
            <React.Fragment>
                {this.renderOwner()}
                {this.renderTable()}
            </React.Fragment>
        );
    };

    render() {
        const {error, loading, acl, owner, wasLoaded} = this.props;

        if (loading && !wasLoaded) {
            return (
                <div className={b('loader-container')}>
                    <Loader size="m" />
                </div>
            );
        }

        if (error && !error.isCancelled) {
            const message = (error.data || error).slice(0, 100);

            return <div className={b('message-container')}>{message}</div>;
        }

        if (!loading && !acl && !owner) {
            return <div className={b('message-container')}>Empty</div>;
        }

        return (
            <div className={b()}>
                <div className={b('result')}>{this.renderResult()}</div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {loading, error, acl, owner, wasLoaded} = state.schemaAcl;

    return {
        acl,
        owner,
        loading,
        error,
        wasLoaded,
    };
};

export default connect(mapStateToProps)(Acl);
