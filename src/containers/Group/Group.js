import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {getGroupInfo, clearStore} from '../../store/reducers/group';
import FullGroupViewer from '../../components/FullGroupViewer/FullGroupViewer';
import {Loader} from '@yandex-cloud/uikit';
import {GROUP_AUTO_RELOAD_INTERVAL} from '../../utils/constants';
import './Group.scss';

const b = cn('group');

class Group extends React.Component {
    static renderLoader() {
        return (
            <div className={'loader'}>
                <Loader size="l" />
            </div>
        );
    }

    static propTypes = {
        className: PropTypes.string,
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        error: PropTypes.bool,
        getGroupInfo: PropTypes.func,
        clearStore: PropTypes.func,
        group: PropTypes.object,
        location: PropTypes.object,
        match: PropTypes.object,
    };

    static defaultProps = {
        className: '',
    };

    componentDidMount() {
        const {id} = this.props.match.params;
        this.props.getGroupInfo(id);
        this.reloadDescriptor = setInterval(
            () => this.props.getGroupInfo(id),
            GROUP_AUTO_RELOAD_INTERVAL,
        );
    }

    componentWillUnmount() {
        this.props.clearStore();
        clearInterval(this.reloadDescriptor);
    }

    renderContent = () => {
        const {className, group} = this.props;
        return (
            <div className={`${b()} ${className}`}>
                <FullGroupViewer group={group} />
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error, group} = this.props;

        if (loading && !wasLoaded) {
            return Group.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else if (group) {
            return this.renderContent();
        } else {
            return <div className="error">no data</div>;
        }
    }
}

const mapStateToProps = (state) => {
    const {data, wasLoaded, loading, error} = state.group;

    let group;
    if (data) {
        group = data.StoragePools[0].Groups[0];
    }

    return {
        group,
        wasLoaded,
        loading,
        error,
    };
};

const mapDispatchToProps = {
    getGroupInfo,
    clearStore,
};

export default connect(mapStateToProps, mapDispatchToProps)(Group);
