import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import DataTable from '@yandex-cloud/react-data-table';
import {Loader} from '@yandex-cloud/uikit';

import {changeUserInput} from '../../../../store/reducers/executeQuery';
import {sendQuery, setQueryOptions} from '../../../../store/reducers/executeTopQueries';
import TruncatedQuery from '../../../../components/TruncatedQuery/TruncatedQuery';
import {AutoFetcher} from '../../../../utils/autofetcher';
import {isColumnEntityType} from '../../utils/schema';

import {DEFAULT_TABLE_SETTINGS} from '../../../../utils/constants';
import {TenantGeneralTabsIds} from '../../TenantPages';
import {prepareQueryError} from '../../../../utils/query';

import './TopQueries.scss';

const b = cn('kv-top-queries');

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
        wasLoaded: PropTypes.bool,
        changeSchemaTab: PropTypes.func,
        currentSchema: PropTypes.object,
        type: PropTypes.string,
        className: PropTypes.string,
    };

    autofetcher;

    componentDidMount() {
        this.autofetcher = new AutoFetcher();
        this.getTopQueries();
        if (this.props.autorefresh) {
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.getTopQueries());
        }
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

    renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    getTopQueries() {
        const {path} = this.props;
        const query = getQueryText(path);
        this.props.sendQuery({query, database: path, action: 'execute-scan'});
    }

    onRowClick = (row) => {
        const {QueryText: input} = row;
        const {changeUserInput, changeSchemaTab} = this.props;

        changeUserInput({input});
        changeSchemaTab(TenantGeneralTabsIds.query);
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
                settings={DEFAULT_TABLE_SETTINGS}
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
        const {error, loading, data, type, className, wasLoaded} = this.props;

        let message;

        if (isColumnEntityType(type)) {
            message = 'No data';
        } else if (error && !error.isCancelled) {
            message = prepareQueryError(error).slice(0, 300);
        } else if (!loading && !data) {
            message = 'No data';
        }

        return loading && !wasLoaded ? (
            this.renderLoader()
        ) : (
            <div className={b()}>
                <div className={b('result', className)}>{message || this.renderResult()}</div>
            </div>
        );
    }
}
const mapStateToProps = (state) => {
    const {loading, data = {}, error, wasLoaded} = state.executeTopQueries;
    const {autorefresh} = state.schema;
    return {
        loading,
        data: data.result,
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
