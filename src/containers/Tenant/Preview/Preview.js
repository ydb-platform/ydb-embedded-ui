import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader, Button} from '@gravity-ui/uikit';

import Icon from '../../../components/Icon/Icon';
import Fullscreen from '../../../components/Fullscreen/Fullscreen';
import {QueryResultTable} from '../../../components/QueryResultTable';

import {sendQuery, setQueryOptions} from '../../../store/reducers/preview';
import {prepareQueryError} from '../../../utils/query';

import {isTableType} from '../utils/schema';
import {AutoFetcher} from '../../../utils/autofetcher';
import EnableFullscreenButton from '../../../components/EnableFullscreenButton/EnableFullscreenButton';
import {setShowPreview} from '../../../store/reducers/schema';

import './Preview.scss';

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
        const {table, autorefresh, setQueryOptions} = this.props;

        if (prevProps.table !== table) {
            this.sendQueryForPreview();
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

        if (!isTableType(type)) {
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

    render() {
        const {error, loading, data, type, wasLoaded, isFullscreen} = this.props;

        if (loading && !wasLoaded) {
            return (
                <div className={b('loader-container')}>
                    <Loader size="m" />
                </div>
            );
        }

        let message;

        if (!isTableType(type)) {
            message = <div className={b('message-container')}>Not available</div>;
        } else if (error) {
            message = <div className={b('message-container')}>{prepareQueryError(error)}</div>;
        }

        const content = message ?? (
            <div className={b('result')}>
                <QueryResultTable data={data.result} columns={data.columns} />
            </div>
        );

        return (
            <div className={b()}>
                {this.renderHeader()}
                {isFullscreen ? <Fullscreen>{content}</Fullscreen> : content}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {data = {}, loading, error, wasLoaded} = state.preview;
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
    setQueryOptions,
    setShowPreview,
};

export default connect(mapStateToProps, mapDispatchToProps)(Preview);
