# UnQue Backend

## Meta lead webhook PoC

Configure `META_VERIFY_TOKEN`, `META_APP_SECRET`, and `META_ACCESS_TOKEN` in the
backend's environment. `META_APP_SECRET` is used only by the backend to verify
Meta's `X-Hub-Signature-256` request signature. Never put it in the mobile app
or expose it to clients.

The current lead store, pending-job queue, deduplication set, and failed-job
records are in memory. They are suitable only for this proof of concept: a
backend restart loses leads and queued/failed jobs, and multiple backend
instances do not share state. Failed jobs stop after five total processing
attempts and are logged and retained in memory for investigation; the retained
records can be inspected with `getFailedMetaLeadJobs()` from
`services/metaLeadQueue.js`.

Before production, move leads and job state to persistent storage and use a
durable queue. Enforce a database uniqueness constraint on `metaLeadId` (and
handle uniqueness conflicts as already-processed events) so deduplication also
works across restarts, concurrent workers, and multiple instances.
