import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader, Button} from '@yandex-cloud/uikit';

import IssuesViewer from './IssuesViewer/IssuesViewer';

import {getHealthcheckInfo} from '../../../store/reducers/healthcheckInfo';

import './Healthcheck.scss';

const b = cn('healthcheck');

class Healthcheck extends React.Component {
    static propTypes = {
        data: PropTypes.object,
        loading: PropTypes.bool,
        error: PropTypes.object,
        getHealthcheckInfo: PropTypes.func,
        tenant: PropTypes.string,
    };

    componentDidMount() {
        this.fetchHealthcheck();
    }

    fetchHealthcheck = () => {
        const {tenant} = this.props;
        this.props.getHealthcheckInfo(tenant);
    };

    renderLoader() {
        return (
            <div className="loader">
                <Loader size="l" />
            </div>
        );
    }

    renderOverviewStatus = () => {
        const {data} = this.props;
        const {self_check_result: selfCheckResult} = data;
        const modifier = selfCheckResult.toLowerCase();

        return (
            <div className={b('self-check-status')}>
                <h3 className={b('self-check-status-label')}>Self check status</h3>
                <div className={b('self-check-status-indicator', {[modifier]: true})} />
                {selfCheckResult}
                <div className={b('self-check-update')}>
                    <Button size="s" onClick={this.fetchHealthcheck}>
                        Update
                    </Button>
                </div>
            </div>
        );
    };

    renderHealthcheckIssues() {
        const {data, showTooltip, hideTooltip} = this.props;
        const {issue_log: issueLog} = data;

        if (!issueLog) {
            return null;
        }

        return (
            <div className={b('issues')}>
                <h3>Issues</h3>
                <IssuesViewer
                    issues={issueLog}
                    showTooltip={showTooltip}
                    hideTooltip={hideTooltip}
                />
            </div>
        );
    }

    render() {
        const {loading, error, data} = this.props;

        if (loading) {
            return this.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else if (data && data['self_check_result']) {
            return (
                <div className={b()}>
                    {this.renderOverviewStatus()}
                    {this.renderHealthcheckIssues()}
                </div>
            );
        } else {
            return <div className="error">no healthcheck data</div>;
        }
    }
}

function mapStateToProps(state) {
    const {data, loading, wasLoaded, error} = state.healthcheckInfo;

    return {
        data,
        loading,
        wasLoaded,
        error,
    };
}

const mapDispatchToProps = {
    getHealthcheckInfo,
};

export default connect(mapStateToProps, mapDispatchToProps)(Healthcheck);
