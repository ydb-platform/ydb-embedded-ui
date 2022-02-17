import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {Loader} from '@yandex-cloud/uikit';
import DataTable from '@yandex-cloud/react-data-table';

import {changeUserInput} from '../../../store/reducers/executeQuery';
import {sendQuery, setQueryOptions} from '../../../store/reducers/executeTopQueries';
import {QUERY} from '../Schema/SchemaPages';
import TruncatedQuery from '../../../components/TruncatedQuery/TruncatedQuery';
import {AutoFetcher} from '../../Cluster/Cluster';
import {OLAP_STORE_TYPE, OLAP_TABLE_TYPE} from '../Schema/SchemaMain/SchemaMain';

import './TopQueries.scss';

const b = cn('kv-top-queries');

const TABLE_SETTINGS = {
    displayIndices: false,
    syncHeadOnResize: true,
    stickyHead: DataTable.MOVING,
    highlightRows: true,
};
const MAX_QUERY_HEIGHT = 10;
const COLUMNS = [
    {
        name: 'CPUTimeUs',
        width: 140,
        sortAccessor: (row) => Number(row['CPUTimeUs']),
    },
    {
        name: 'QueryText',
        width: 500,
        sortable: false,
        // eslint-disable-next-line
        render: ({value}) => <TruncatedQuery value={value} maxQueryHeight={MAX_QUERY_HEIGHT} />,
    },
];
const getQueryText = (path) => `
--!syntax_v1
$last = (
    SELECT
        MAX(IntervalEnd)
    FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
);
SELECT
    CPUTime as CPUTimeUs,
    QueryText
FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
WHERE IntervalEnd IN $last
`;

class TopQueries extends React.Component {
    static propTypes = {
        error: PropTypes.string,
        sendQuery: PropTypes.func,
        path: PropTypes.string,
        data: PropTypes.array,
        loading: PropTypes.bool,
        changeSchemaTab: PropTypes.func,
        currentSchema: PropTypes.object,
    };

    autofetcher;

    componentDidMount() {
        this.autofetcher = new AutoFetcher();
        this.getTopQueries();
    }

    componentDidUpdate(prevProps) {
        const {autorefresh, path, setQueryOptions} = this.props;

        if (autorefresh && !prevProps.autorefresh) {
            this.getTopQueries();
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.getTopQueries());
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }

        if (path !== prevProps.path) {
            setQueryOptions({
                wasLoaded: false,
                data: undefined,
            });
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    getTopQueries() {
        const {path} = this.props;
        const query = getQueryText(path);
        this.props.sendQuery({query, database: path, action: 'execute-scan'});
    }

    onRowClick = (row) => {
        const {QueryText: input} = row;
        const {changeUserInput, changeSchemaTab} = this.props;

        changeUserInput({input});
        changeSchemaTab(QUERY);
    };

    renderTable = () => {
        const {data} = this.props;

        if (!data) {
            return null;
        }

        return (
            <DataTable
                columns={COLUMNS}
                data={data}
                settings={TABLE_SETTINGS}
                onRowClick={this.onRowClick}
            />
        );
    };

    renderResult = () => {
        return (
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>{this.renderTable()}</div>
            </div>
        );
    };

    render() {
        const {error, loading, data, wasLoaded, type} = this.props;

        if (loading && !wasLoaded) {
            return (
                <div className={b('loader-container')}>
                    <Loader size="m" />
                </div>
            );
        }

        let message;
        if (type === OLAP_STORE_TYPE || type === OLAP_TABLE_TYPE) {
            message = 'No data';
        } else if (error && !error.isCancelled) {
            message = (error.data || error).slice(0, 300);
        } else if (!loading && !data) {
            message = 'No data';
        }

        if (message) {
            return <div className={b('message-container')}>{message}</div>;
        }

        return (
            <div className={b()}>
                <div className={b('result')}>{this.renderResult()}</div>
            </div>
        );
    }
}
const mapStateToProps = (state) => {
    const {loading, data, error, wasLoaded} = state.executeTopQueries;
    const {autorefresh} = state.schema;
    return {
        loading,
        data,
        error,
        wasLoaded,
        autorefresh,
    };
};

const mapDispatchToProps = {
    sendQuery,
    changeUserInput,
    setQueryOptions,
};

export default connect(mapStateToProps, mapDispatchToProps)(TopQueries);
