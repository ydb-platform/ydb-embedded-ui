import React from 'react';

import {Button} from '@gravity-ui/uikit';

import type {MultipartChunk} from '../../store/reducers/multipart/multipart';
import {useLazyStreamMultipartQuery} from '../../store/reducers/multipart/multipart';

const ANIMATION_DURATION = 300;

export function MultipartTest() {
    const [receivedChunks, setReceivedChunks] = React.useState<MultipartChunk[]>([]);

    const handleChunk = React.useCallback((chunk: MultipartChunk) => {
        console.log('handleChunk called in component:', chunk);
        console.log(chunk);
        setReceivedChunks((prevChunks: MultipartChunk[]) => {
            // Create a new array with the new chunk
            const newChunks = [chunk, ...prevChunks];
            // Sort by part_number in descending order to show newest first
            return newChunks;
        });
    }, []);

    const [trigger, {error, isLoading}] = useLazyStreamMultipartQuery();
    const requestRef = React.useRef<ReturnType<typeof trigger> | null>(null);

    const handleStart = React.useCallback(() => {
        console.log('Starting stream...');
        setReceivedChunks([]);
        requestRef.current = trigger({
            url: '/viewer/json/query',
            onChunk: handleChunk,
        });
    }, [trigger, handleChunk]);

    const handleStop = React.useCallback(() => {
        console.log('Stopping stream...');
        requestRef.current?.abort();
        requestRef.current = null;
    }, []);

    const handleButtonClick = React.useCallback(() => {
        if (isLoading) {
            handleStop();
        } else {
            handleStart();
        }
    }, [isLoading, handleStart, handleStop]);

    const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) {
            return err.message;
        }
        if (typeof err === 'object') {
            return JSON.stringify(err);
        }
        return String(err);
    };

    return (
        <div
            className="multipart-test"
            style={{padding: '32px', maxWidth: '800px', margin: '0 auto'}}
        >
            <h2
                style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    marginBottom: '24px',
                    color: 'var(--g-color-text-primary)',
                }}
            >
                Multipart Streaming Test
            </h2>

            <div style={{marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center'}}>
                <Button view="action" size="l" onClick={handleButtonClick} loading={isLoading}>
                    {isLoading ? 'Stop Streaming' : 'Start Streaming'}
                </Button>
                {receivedChunks.length > 0 && (
                    <span
                        style={{
                            color: 'var(--g-color-text-secondary)',
                            fontSize: '14px',
                        }}
                    >
                        Received: {receivedChunks.length} chunks
                    </span>
                )}
            </div>

            {Boolean(error) && (
                <div
                    style={{
                        color: 'var(--g-color-text-danger)',
                        marginBottom: '24px',
                        padding: '12px',
                        backgroundColor: 'var(--g-color-danger-light)',
                        borderRadius: '6px',
                        fontSize: '14px',
                    }}
                >
                    {`Error: ${getErrorMessage(error)}`}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {receivedChunks.map((chunk: MultipartChunk) => {
                    const content = chunk.content || {};
                    const counter = content.Counter || 0;

                    return (
                        <div
                            key={chunk.part_number}
                            style={{
                                padding: '16px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--g-color-base-generic)',
                                color: 'var(--g-color-text-primary)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                animation: `fadeIn ${ANIMATION_DURATION}ms ease-out`,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '8px',
                                    fontSize: '12px',
                                    opacity: 0.8,
                                }}
                            >
                                <span>Counter: {counter}</span>
                                <span>Part {chunk.part_number}</span>
                            </div>
                            <div
                                style={{
                                    fontSize: '16px',
                                    lineHeight: '1.5',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {JSON.stringify(content, null, 2)}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
