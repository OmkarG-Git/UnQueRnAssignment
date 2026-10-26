const axios = require("axios");
const { addLead, findLeadByMetaLeadId } = require("./lead.service");
const { getIo } = require("../socketConnection/socketInstance");
const AppError = require("../utils/AppError");

const processMetaLeadEvent = async (event) => {
    if (findLeadByMetaLeadId(event.leadId)) {
        return;
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    if (!accessToken) {
        throw new AppError("META_ACCESS_TOKEN is not configured", 500);
    }

    const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";
    const response = await axios.get(
        `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(event.leadId)}`,
        {
            params: {
                fields: "id,created_time,field_data",
                access_token: accessToken,
            },
            timeout: 10000,
        }
    );

    const metaLead = response.data;
    if (
        typeof metaLead?.id !== "string" ||
        !Array.isArray(metaLead.field_data)
    ) {
        throw new AppError("Meta returned invalid lead details", 502);
    }

    const fields = Object.create(null);
    for (const field of metaLead.field_data) {
        if (typeof field?.name !== "string") {
            continue;
        }

        const key = field.name.trim().toLowerCase().replace(/\s+/g, "_");
        const value = Array.isArray(field.values) ? field.values[0] : null;
        fields[key] =
            typeof value === "string" && value.trim() ? value.trim() : null;
    }

    const savedLead = addLead({
        metaLeadId: metaLead.id,
        name:
            fields.full_name ||
            [fields.first_name, fields.last_name].filter(Boolean).join(" ") ||
            null,
        email: fields.email,
        phone: fields.phone_number || fields.phone,
        pageId: event.pageId,
        formId: event.formId,
        createdTime: metaLead.created_time || null,
        source: "META_LEAD_ADS",
    });

    getIo().emit("newLead", savedLead);
    console.log(`Meta lead processed successfully: ${event.leadId}`);
};

module.exports = { processMetaLeadEvent };
