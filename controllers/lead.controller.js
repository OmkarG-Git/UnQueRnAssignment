const { getAllLead, addLead } = require('../services/lead.service');
const { getIo } = require('../socketConnection/socketInstance');
const AppError = require('../utils/AppError');

const getLeadsController = (req, res) => {
    const leads = getAllLead();

    return res.status(200).json({
        success: true,
        message: "leads fetched successfully",
        data: leads
    })
} 

const addLeadController = (req, res) => {
    console.log('Request body:', req.body);
    const { name, email, phone } = req.body

    if(!name || !email) {
        throw new AppError(
            'Name and email are required',
            400
        )
    }

    const lead = addLead({
        name,
        email,
        phone: phone || ''
    });

    const io = getIo();

    io.emit('newLead', lead)

    return res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead
    })
}



module.exports = {
    getLeadsController,
    addLeadController
}