const leads = [];

const getAllLead = () => {
    return leads;
}

const findLeadByMetaLeadId = (metaLeadId) => {
    return leads.find((lead) => lead.metaLeadId === metaLeadId);
}

const addLead = (lead) => {
    const newLead = {
        id: Date.now().toString(),
        ...lead,
        createdAt: new Date().toISOString()
    };

    leads.push(newLead);
    return newLead;
}
    
module.exports = {
    getAllLead,
    findLeadByMetaLeadId,
    addLead
}