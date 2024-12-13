import React from 'react';

import {Button} from '@gravity-ui/uikit';

import type {MultipartChunk} from '../../store/reducers/multipart/multipart';
import {useStreamMultipartQuery} from '../../store/reducers/multipart/multipart';

const ANIMATION_DURATION = 300;

export function MultipartTest() {
    const [startStream, setStartStream] = React.useState(false);
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

    console.log('Component rendered, startStream:', startStream);

    const {error, isLoading} = useStreamMultipartQuery(
        {
            url: '/viewer/json/query',
            onChunk: handleChunk,
        },
        {
            skip: !startStream,
        },
    );

    const handleStart = React.useCallback(() => {
        console.log('Starting stream...');
        setReceivedChunks([]);
        setStartStream(true);
    }, []);

    const handleStop = React.useCallback(() => {
        console.log('Stopping stream...');
        setStartStream(false);
    }, []);

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
                <Button
                    view="action"
                    size="l"
                    onClick={startStream ? handleStop : handleStart}
                    loading={isLoading}
                >
                    {startStream ? 'Stop Streaming' : 'Start Streaming'}
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
                    const {color = '#e5e5e5', message = '', id} = content;

                    return (
                        <div
                            key={chunk.part_number}
                            style={{
                                padding: '16px',
                                borderRadius: '8px',
                                backgroundColor: color,
                                color: isLightColor(color) ? '#000' : '#fff',
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
                                <span>ID: {id}</span>
                                <span>
                                    Part {chunk.part_number} of {chunk.total_parts}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: '16px',
                                    lineHeight: '1.5',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {message}
                            </div>
                            {chunk.result && (
                                <div
                                    style={{
                                        marginTop: '8px',
                                        fontSize: '14px',
                                        opacity: 0.8,
                                    }}
                                >
                                    Result: {chunk.result}
                                </div>
                            )}
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

// Helper function to determine if a color is light or dark
function isLightColor(color: string) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
}
