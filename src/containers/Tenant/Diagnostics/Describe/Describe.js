import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {Loader} from '@yandex-cloud/uikit';
import JSONTree from 'react-json-inspector';

import {getDescribe} from '../../../../store/reducers/describe';

import './Describe.scss';
import 'react-json-inspector/json-inspector.css';
import {AutoFetcher} from '../../../../utils/autofetcher';

const b = cn('kv-describe');

const expandMap = new Map();

class Describe extends React.Component {
    static propTypes = {
        error: PropTypes.string,
        data: PropTypes.array,
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        autorefresh: PropTypes.bool,
        tenant: PropTypes.string,
    };

    autofetcher;

    componentDidMount() {
        const {autorefresh} = this.props;
        this.autofetcher = new AutoFetcher();
        this.fetchData();
        if (autorefresh) {
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.fetchData);
        }
    }

    componentDidUpdate(prevProps) {
        const {autorefresh} = this.props;

        if (autorefresh && !prevProps.autorefresh) {
            this.fetchData();
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() => this.fetchData());
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    fetchData() {
        const {getDescribe, tenant, currentSchemaPath} = this.props;
        const path = currentSchemaPath || tenant;
        getDescribe({path});
    }

    renderDescribeJson = () => {
        const {data} = this.props;

        return (
            <JSONTree
                data={data}
                className={b('tree')}
                onClick={({path}) => {
                    const newValue = !(expandMap.get(path) || false);
                    expandMap.set(path, newValue);
                }}
                searchOptions={{
                    debounceTime: 300,
                }}
                isExpanded={(keypath) => {
                    return expandMap.get(keypath) || false;
                }}
            />
        );
    };

    render() {
        const {error, loading, data, wasLoaded} = this.props;

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

        if (!loading && !data) {
            return <div className={b('message-container')}>Empty</div>;
        }

        return (
            <div className={b()}>
                <div className={b('result')}>{this.renderDescribeJson()}</div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {loading, error, currentDescribe, wasLoaded} = state.describe;
    const {autorefresh, currentSchemaPath} = state.schema;

    return {
        data: currentDescribe,
        loading,
        error,
        wasLoaded,
        autorefresh,
        currentSchemaPath,
    };
};

const mapDispatchToProps = {
    getDescribe,
};

export default connect(mapStateToProps, mapDispatchToProps)(Describe);
