import React from 'react';

import {Button} from '@gravity-ui/uikit';

import type {MultipartChunk} from '../../store/reducers/multipart/multipart';
import {useLazyStreamMultipartQuery} from '../../store/reducers/multipart/multipart';

const ANIMATION_DURATION = 300;
const TOTAL_EXPECTED_CHUNKS = 9999;
const GRID_SIZE = 50; // Number of squares per row

export function MultipartTest() {
    const [receivedChunks, setReceivedChunks] = React.useState<MultipartChunk[]>([]);
    const [receivedCounters, setReceivedCounters] = React.useState<Set<number>>(new Set());

    const handleChunk = React.useCallback((chunk: MultipartChunk) => {
        console.log('handleChunk called in component:', chunk);
        console.log(chunk);
        setReceivedChunks((prevChunks: MultipartChunk[]) => {
            // Create a new array with the new chunk
            const newChunks = [chunk, ...prevChunks];
            // Sort by part_number in descending order to show newest first
            return newChunks;
        });
        setReceivedCounters((prev) => {
            const counter = chunk.content?.Counter || 0;
            return new Set([...prev, counter]);
        });
    }, []);

    const getMissingCounters = React.useCallback(() => {
        const missing: number[] = [];
        for (let i = 1; i <= TOTAL_EXPECTED_CHUNKS; i++) {
            if (!receivedCounters.has(i)) {
                missing.push(i);
            }
        }
        return missing;
    }, [receivedCounters]);

    const renderProgressGrid = React.useCallback(() => {
        const cells = [];
        for (let i = 1; i <= TOTAL_EXPECTED_CHUNKS; i++) {
            const isReceived = receivedCounters.has(i);
            cells.push(
                <div
                    key={i}
                    style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: isReceived
                            ? 'var(--g-color-success)'
                            : 'var(--g-color-base-generic)',
                        margin: '1px',
                        transition: 'background-color 0.3s ease',
                    }}
                    title={`Counter: ${i}`}
                />,
            );
        }
        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 8px)`,
                    gap: '1px',
                    padding: '16px',
                    backgroundColor: 'var(--g-color-base-generic-hover)',
                    borderRadius: '8px',
                    marginBottom: '24px',
                }}
            >
                {cells}
            </div>
        );
    }, [receivedCounters]);

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
                <Button view="action" size="l" onClick={handleButtonClick}>
                    {isLoading ? 'Stop Streaming' : 'Start Streaming'}
                </Button>
                {receivedChunks.length > 0 && (
                    <span
                        style={{
                            color: 'var(--g-color-text-secondary)',
                            fontSize: '14px',
                        }}
                    >
                        Received: {receivedChunks.length} chunks (
                        {Math.round((receivedCounters.size / TOTAL_EXPECTED_CHUNKS) * 100)}%)
                    </span>
                )}
            </div>

            {renderProgressGrid()}

            {receivedChunks.length > 0 && (
                <div
                    style={{
                        marginBottom: '24px',
                        padding: '12px',
                        backgroundColor: 'var(--g-color-base-generic)',
                        borderRadius: '6px',
                        fontSize: '14px',
                    }}
                >
                    <div style={{marginBottom: '8px', fontWeight: 500}}>Progress Analysis:</div>
                    <div>Total Expected: {TOTAL_EXPECTED_CHUNKS}</div>
                    <div>Received: {receivedCounters.size}</div>
                    <div>Missing: {TOTAL_EXPECTED_CHUNKS - receivedCounters.size}</div>
                    {receivedCounters.size < TOTAL_EXPECTED_CHUNKS && (
                        <div style={{marginTop: '8px'}}>
                            <div style={{marginBottom: '4px'}}>First 10 missing counters:</div>
                            <div style={{color: 'var(--g-color-text-secondary)'}}>
                                {getMissingCounters().slice(0, 10).join(', ')}
                                {getMissingCounters().length > 10 ? '...' : ''}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                                backgroundColor: 'var(--g-color-success-light)',
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
