# MultipartAPI Usage Example

The MultipartAPI class provides handling for multipart/x-mixed-replace responses. Here's how to use it:

```typescript
import {multipartAPI} from './multipart';

interface ChunkContent {
  content: string;
}

// Example usage with the provided response format
async function fetchMultipartData() {
  try {
    const chunks = await multipartAPI.streamMultipartResponse<ChunkContent>('/your-endpoint');

    // Process chunks
    chunks.forEach((chunk) => {
      console.log(`Part ${chunk.part_number} of ${chunk.total_parts}`);
      console.log('Content:', chunk.content);

      // Check for completion
      if (chunk.result === 'ok') {
        console.log('Stream completed successfully');
      }
    });
  } catch (error) {
    console.error('Error fetching multipart data:', error);
  }
}

// Example response format that will be handled:
/*
--boundary
Content-Type: application/json
Content-Length: 63

{
  "part_number": 1,
  "total_parts": 3,
  "content": "abcdef"
}
--boundary
Content-Type: application/json
Content-Length: 63

{
  "part_number": 2,
  "total_parts": 3,
  "content": "fedcba"
}
--boundary
Content-Type: application/json
Content-Length: 81

{
  "part_number": 3,
  "total_parts": 3,
  "content": "xxxxxxx",
  "result": "ok"
}
--boundary--
*/
```

The MultipartAPI will:

1. Automatically handle multipart/x-mixed-replace responses
2. Parse the boundary from Content-Type header
3. Split and parse individual JSON chunks
4. Return an array of typed chunks with part_number, total_parts, content, and optional result
5. Handle proper TypeScript generics for type safety

Each chunk will have the following structure:

```typescript
interface MultipartChunk<T> {
  part_number: number;
  total_parts: number;
  content: T;
  result?: string;
}
```

You can specify the type of content using generics when calling streamMultipartResponse.
