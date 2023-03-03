import {useEffect, useMemo} from 'react';
import {useDispatch} from 'react-redux';

import type {EPathType} from '../../../../types/api/schema';

import {useTypedSelector} from '../../../../utils/hooks';

import {
    cleanTopicData,
    getTopic,
    setDataWasNotLoaded as setTopicDataWasNotLoaded,
} from '../../../../store/reducers/topic';
import {
    getNodes,
    setDataWasNotLoaded as setNodesDataWasNotLoaded,
} from '../../../../store/reducers/nodes';

import {Loader} from '../../../../components/Loader';
import {ResponseError} from '../../../../components/Errors/ResponseError';

import {Partitions} from './Partitions';

interface PartitionsWrapperProps {
    path?: string;
    type?: EPathType;
}

export const PartitionsWrapper = ({path, type}: PartitionsWrapperProps) => {
    const dispatch = useDispatch();

    const {
        loading: topicLoading,
        wasLoaded: topicWasLoaded,
        error: topicError,
        data: topicData,
    } = useTypedSelector((state) => state.topic);

    const {
        loading: nodesLoading,
        wasLoaded: nodesWasLoaded,
        error: nodesError,
        data: nodesData,
    } = useTypedSelector((state) => state.nodes);

    const consumers = useMemo(
        () =>
            topicData?.consumers
                ?.map((consumer) => consumer?.name)
                .filter((consumer): consumer is string => consumer !== undefined),
        [topicData],
    );

    const nodes = useMemo(() => {
        const preparedNodesObject: Record<number, string> = {};
        nodesData?.forEach((node) => {
            if (node.NodeId && node.Host) {
                preparedNodesObject[node.NodeId] = node.Host;
            }
        });
        return preparedNodesObject;
    }, [nodesData]);

    useEffect(() => {
        dispatch(setTopicDataWasNotLoaded());
        dispatch(cleanTopicData());
        dispatch(setNodesDataWasNotLoaded());

        dispatch(getTopic(path));
        dispatch(getNodes({}));
    }, [dispatch, path]);

    if ((topicLoading && !topicWasLoaded) || (nodesLoading && !nodesWasLoaded)) {
        return <Loader />;
    }

    if (topicError || nodesError) {
        return <ResponseError error={topicError || nodesError} />;
    }

    return <Partitions path={path} type={type} consumers={consumers} nodes={nodes} />;
};
