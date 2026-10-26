const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { getLeadsController, addLeadController } = require("../controllers/lead.controller");

router.get("/", asyncHandler(getLeadsController));

router.post('/', asyncHandler(addLeadController))

module.exports = router;
