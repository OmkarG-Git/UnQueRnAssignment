
const crypto = require("crypto");
const { enqueueMetaLeadEvents } = require("../services/metaLeadQueue");
const AppError = require("../utils/AppError");

const verifyMetaWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN;

    if (!verifyToken) {
        throw new AppError("META_VERIFY_TOKEN is not configured", 500);
    }

    if (
        mode !== "subscribe" ||
        typeof token !== "string" ||
        token !== verifyToken ||
        typeof challenge !== "string"
    ) {
        return res.sendStatus(403);
    }

    return res.status(200).send(challenge);
};

const isValidMetaSignature = (signature, rawBody, appSecret) => {
    if (
        typeof signature !== "string" ||
        !/^sha256=[a-f0-9]{64}$/i.test(signature) ||
        !Buffer.isBuffer(rawBody)
    ) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest();
    const receivedSignature = Buffer.from(signature.slice("sha256=".length), "hex");

    return crypto.timingSafeEqual(expectedSignature, receivedSignature);
};

const handleMetaWebhook = (req, res) => {

    console.log("hey there its me for first");

    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
        throw new AppError("META_APP_SECRET is not configured", 500);
    }

    if (!isValidMetaSignature(
        req.get("X-Hub-Signature-256"),
        req.rawBody,
        appSecret
    )) {
        return res.sendStatus(401);
    }

    const { object, entry: entries } = req.body || {};

    if (object !== "page") {
        return res.sendStatus(403);
    }

    if (!Array.isArray(entries)) {
        return res.sendStatus(400);
    }

    const events = [];

    for (const item of entries) {
        if (!Array.isArray(item?.changes)) {
            continue;
        }

        for (const change of item.changes) {
            if (change?.field !== "leadgen") {
                continue;
            }

            const leadData = change.value;
            if (
                !leadData ||
                typeof leadData.leadgen_id !== "string" ||
                !leadData.leadgen_id.trim()
            ) {
                console.warn("Ignoring Meta leadgen event with no leadgen_id");
                continue;
            }

            events.push({
                leadId: leadData.leadgen_id.trim(),
                pageId: leadData.page_id || item.id || null,
                formId: leadData.form_id || null,
            });
        }
    }

    if (events.length > 0) {
        if (!process.env.META_ACCESS_TOKEN) {
            throw new AppError("META_ACCESS_TOKEN is not configured", 500);
        }

        enqueueMetaLeadEvents(events);
    }

    console.log("hey there its me", events);

    return res.sendStatus(200);
};


module.exports = {
    verifyMetaWebhook,
    handleMetaWebhook,
};