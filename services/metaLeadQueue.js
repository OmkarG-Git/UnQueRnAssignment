const { processMetaLeadEvent } = require("./metaLeadProcessor");

const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const MAX_ATTEMPTS = 5;

const jobs = [];
const failedJobs = [];
const pendingLeadIds = new Set();
let isProcessing = false;
let isScheduled = false;

const scheduleProcessing = () => {
    if (isProcessing || isScheduled) {
        return;
    }

    isScheduled = true;
    setImmediate(() => {
        isScheduled = false;
        processQueue().catch((error) => {
            console.error("Meta lead queue failed:", error.message);
        });
    });
};

const processQueue = async () => {
    if (isProcessing) {
        return;
    }

    isProcessing = true;
    try {
        while (jobs.length > 0) {
            const job = jobs.shift();

            try {
                await processMetaLeadEvent(job.event);
                pendingLeadIds.delete(job.event.leadId);
            } catch (error) {
                job.attempts += 1;
                if (job.attempts >= MAX_ATTEMPTS) {
                    pendingLeadIds.delete(job.event.leadId);
                    const failedJob = {
                        event: job.event,
                        attempts: job.attempts,
                        failedAt: new Date().toISOString(),
                        error: error.message,
                    };
                    failedJobs.push(failedJob);
                    console.error(
                        `Meta lead job permanently failed after ${job.attempts} attempts (${job.event.leadId}):`,
                        error.message
                    );
                    continue;
                }

                const delay = Math.min(
                    INITIAL_RETRY_DELAY_MS * 2 ** Math.min(job.attempts - 1, 5),
                    MAX_RETRY_DELAY_MS
                );
                console.error(
                    `Meta lead processing failed; retry ${job.attempts} in ${delay}ms (${job.event.leadId}):`,
                    error.message
                );
                setTimeout(() => {
                    jobs.push(job);
                    scheduleProcessing();
                }, delay);
            }
        }
    } finally {
        isProcessing = false;
        if (jobs.length > 0) {
            scheduleProcessing();
        }
    }
};

const enqueueMetaLeadEvents = (events) => {
    for (const event of events) {
        if (pendingLeadIds.has(event.leadId)) {
            continue;
        }

        pendingLeadIds.add(event.leadId);
        jobs.push({ event, attempts: 0 });
    }

    scheduleProcessing();
};

const getFailedMetaLeadJobs = () => {
    return failedJobs.map((job) => ({
        ...job,
        event: { ...job.event },
    }));
};

module.exports = { enqueueMetaLeadEvents, getFailedMetaLeadJobs };
