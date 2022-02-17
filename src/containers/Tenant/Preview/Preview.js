import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable from '@yandex-cloud/react-data-table';
import {Loader} from '@yandex-cloud/uikit';

import {sendQuery, setQueryOptions} from '../../../store/reducers/preview';
import {showTooltip, hideTooltip} from '../../../store/reducers/tooltip';
import {prepareQueryResponse} from '../../../utils/index';

import {OLAP_TABLE_TYPE, TABLE_TYPE} from '../Schema/SchemaMain/SchemaMain';
import {AutoFetcher} from '../../Cluster/Cluster';

import './Preview.scss';

const TABLE_SETTINGS = {
    displayIndices: false,
    syncHeadOnResize: true,
    stickyHead: DataTable.MOVING,
};

const b = cn('kv-preview');

class Preview extends React.Component {
    static propTypes = {
        sendQuery: PropTypes.func,
        database: PropTypes.string,
        table: PropTypes.string,
        error: PropTypes.string,
        data: PropTypes.array,
        loading: PropTypes.bool,
        type: PropTypes.string,
        showTooltip: PropTypes.func,
        hideTooltip: PropTypes.func,
        partCount: PropTypes.string,
    };

    autofetcher;

    componentDidMount() {
        this.sendQueryForPreview();
        this.autofetcher = new AutoFetcher();
        if (this.props.autorefresh) {
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.sendQueryForPreview());
        }
    }

    componentDidUpdate(prevProps) {
        const {table, hideTooltip, autorefresh, setQueryOptions} = this.props;

        if (prevProps.table !== table) {
            this.sendQueryForPreview();
            hideTooltip();
            setQueryOptions({
                wasLoaded: false,
                data: undefined,
            });
        }

        if (autorefresh && !prevProps.autorefresh) {
            this.sendQueryForPreview();
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.sendQueryForPreview());
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    sendQueryForPreview = () => {
        const {sendQuery, database, table, type} = this.props;

        if (type !== TABLE_TYPE && type !== OLAP_TABLE_TYPE) {
            return;
        }

        const query = `--!syntax_v1\nselect * from \`${table}\` limit 32`;
        sendQuery({
            query,
            database: database,
            action: 'execute-scan',
            path: table,
        });
    };

    renderTable = () => {
        const {data, showTooltip} = this.props;

        let columns = [];
        if (data && data.length > 0) {
            columns = Object.keys(data[0]).map((key) => ({
                name: key,
                render: ({value}) => {
                    return (
                        <span
                            className={b('cell')}
                            onClick={(e) => showTooltip(e.target, value, 'cell')}
                        >
                            {value}
                        </span>
                    );
                },
            }));
        }

        const preparedData = prepareQueryResponse(data);

        return <DataTable columns={columns} data={preparedData} settings={TABLE_SETTINGS} />;
    };

    render() {
        const {error, loading, data = [], type, wasLoaded} = this.props;

        if (type !== TABLE_TYPE && type !== OLAP_TABLE_TYPE) {
            return <div className={b('message-container')}>Not available</div>;
        }

        if (loading && !wasLoaded) {
            return (
                <div className={b('loader-container')}>
                    <Loader size="m" />
                </div>
            );
        }

        if (error) {
            return <div className={b('message-container')}>{error.data || error}</div>;
        }

        if (!loading && data.length === 0) {
            return <div className={b('message-container')}>Table is empty</div>;
        }

        return (
            <div className={b()}>
                <div className={b('result')}>{this.renderTable()}</div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {data = [], loading, error, wasLoaded} = state.preview;
    const {autorefresh} = state.schema;

    return {
        data,
        loading,
        error,
        autorefresh,
        wasLoaded,
    };
};

const mapDispatchToProps = {
    sendQuery,
    showTooltip,
    hideTooltip,
    setQueryOptions,
};

export default connect(mapStateToProps, mapDispatchToProps)(Preview);
