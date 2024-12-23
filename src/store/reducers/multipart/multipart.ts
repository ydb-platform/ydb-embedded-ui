import {api} from '../api';

export interface MultipartChunk<T = any> {
    part_number: number;
    total_parts: number;
    content: T;
    result?: string;
}

interface StreamOptions {
    url: string;
    onChunk?: (chunk: MultipartChunk<any>) => void;
}

export const multipartApi = api.injectEndpoints({
    endpoints: (build) => ({
        streamMultipart: build.query<void, StreamOptions>({
            queryFn: async ({url, onChunk}, _signal, _extraOptions, _baseQuery) => {
                try {
                    console.log('Starting multipart stream with onChunk:', Boolean(onChunk));

                    await window.api.multipart?.streamMultipartResponse(
                        url,
                        (chunk: MultipartChunk) => {
                            console.log('Received chunk in reducer:', chunk);
                            if (onChunk) {
                                console.log('Calling onChunk callback');
                                onChunk(chunk);
                            }
                        },
                    );

                    return {data: undefined};
                } catch (error) {
                    console.error('Error in multipart stream:', error);
                    return {
                        error: {
                            status: 'CUSTOM_ERROR',
                            error: error instanceof Error ? error.message : 'Unknown error',
                        },
                    };
                }
            },
            providesTags: ['All'],
        }),
    }),
});

export const {useStreamMultipartQuery} = multipartApi;
