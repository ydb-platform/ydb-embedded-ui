import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import DataTable from '@yandex-cloud/react-data-table';
import {Loader, Button} from '@yandex-cloud/uikit';

import Icon from '../../../components/Icon/Icon';
import Fullscreen from '../../../components/Fullscreen/Fullscreen';

import {sendQuery, setQueryOptions} from '../../../store/reducers/preview';
import {showTooltip, hideTooltip} from '../../../store/reducers/tooltip';
import {prepareQueryResponse} from '../../../utils/index';

import {OLAP_TABLE_TYPE, TABLE_TYPE} from '../Tenant';
import {AutoFetcher} from '../../../utils/autofetcher';
import EnableFullscreenButton from '../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {DEFAULT_TABLE_SETTINGS} from '../../../utils/constants';
import {setShowPreview} from '../../../store/reducers/schema';

import './Preview.scss';

const TABLE_SETTINGS = {
    ...DEFAULT_TABLE_SETTINGS,
    stripedRows: true,
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

    onClosePreview = () => {
        this.props.setShowPreview(false);
    };

    renderHeader = () => {
        const {currentSchemaPath, error} = this.props;
        return (
            <div className={b('header')}>
                <div className={b('title')}>
                    Preview <div className={b('table-name')}>{currentSchemaPath}</div>
                </div>
                <div className={b('controls-left')}>
                    <EnableFullscreenButton disabled={Boolean(error)} />
                    <Button
                        view="flat-secondary"
                        onClick={this.onClosePreview}
                        title="Close preview"
                    >
                        <Icon name="close" viewBox={'0 0 16 16'} width={16} height={16} />
                    </Button>
                </div>
            </div>
        );
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
        const {error, loading, data = [], type, wasLoaded, isFullscreen} = this.props;

        let message;

        if (type !== TABLE_TYPE && type !== OLAP_TABLE_TYPE) {
            message = <div className={b('message-container')}>Not available</div>;
        }

        if (loading && !wasLoaded) {
            return (
                <div className={b('loader-container')}>
                    <Loader size="m" />
                </div>
            );
        }

        if (error) {
            message = (
                <div className={b('message-container')}>
                    {error.data?.error?.message || error.data || error}
                </div>
            );
        }

        if (!loading && data.length === 0) {
            message = <div className={b('message-container')}>Table is empty</div>;
        }

        const content = message ?? <div className={b('result')}>{this.renderTable()}</div>;

        return (
            <div className={b()}>
                {this.renderHeader()}
                {isFullscreen ? <Fullscreen>{content}</Fullscreen> : content}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {data = [], loading, error, wasLoaded} = state.preview;
    const {autorefresh, currentSchemaPath} = state.schema;

    return {
        data,
        loading,
        error,
        autorefresh,
        wasLoaded,
        currentSchemaPath,
        isFullscreen: state.fullscreen,
    };
};

const mapDispatchToProps = {
    sendQuery,
    showTooltip,
    hideTooltip,
    setQueryOptions,
    setShowPreview,
};

export default connect(mapStateToProps, mapDispatchToProps)(Preview);
