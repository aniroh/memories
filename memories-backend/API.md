# Media and memory API

All routes begin with `/api`. There is no authentication yet because this is a
private, two-person V1; do not expose these endpoints publicly without adding
authentication.

## Browser-to-R2 upload flow

1. `POST /uploads/presign`

   ```json
   {
     "files": [
       { "fileName": "goa.jpg", "contentType": "image/jpeg", "sizeBytes": 1839201 }
     ]
   }
   ```

   The response contains a `batchId` and one temporary `uploadUrl` per file.
   Upload each selected file directly to its URL with `PUT` and the matching
   `Content-Type` header. URLs expire after 15 minutes.

2. `POST /uploads/complete`

   ```json
   {
     "batchId": "<batch id from presign>",
     "uploads": [
       {
         "key": "<key from presign>",
         "fileName": "goa.jpg",
         "contentType": "image/jpeg",
         "sizeBytes": 1839201
       }
     ]
   }
   ```

   The API checks every object in R2, creates `Media` documents, and creates a
   `DraftMemory` with a gallery block. The response contains both `media` and
   `draft`.

V1 upload limits are 20 files and 500 MB per batch; image files may be 25 MB,
video files 500 MB, and audio files 100 MB. The Angular app should upload no
more than three files concurrently.

`GET /uploads/media/:id/read-url` returns a temporary URL for displaying a
private media item.

## Curation APIs

| Resource | Routes |
| --- | --- |
| Media | `GET /media`, `DELETE /media/:id` |
| Drafts | `GET, POST /drafts`, `GET, PATCH, DELETE /drafts/:id`, `POST /drafts/:id/approve` |
| Memories | `GET, POST /memories`, `GET, PATCH, DELETE /memories/:id` |

Approving a draft creates the final Memory in an Atlas transaction and links the
draft to it. A title is required before approval.

Deleting a draft or memory deletes only that document, never its media. This is
intentional: the same asset might be used in more than one story. Deleting
media deletes its R2 original/preview/thumbnail and its MongoDB record, but
returns `409 Conflict` while the media is still used by a draft or memory.

## Required R2 CORS configuration

Direct browser `PUT` uploads require bucket CORS. Set `CORS_ORIGINS` to
`http://localhost:4200` and, after deployment, your Cloudflare Pages domain.
Then run:

```bash
npm run configure:r2-cors
```

The current R2 credentials can read/write objects but lack permission to modify
bucket CORS. Create or temporarily use an R2 API token with bucket-configuration
(R2 Admin Read & Write) permission, update the two R2 credential values in
`.env`, run the command, then restore the normal object read/write token if you
prefer.
