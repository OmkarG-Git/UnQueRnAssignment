const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
    verifyMetaWebhook,
    handleMetaWebhook,
} = require("../controllers/metaWebhook.controller");
const router = express.Router();


router.get('/', asyncHandler(verifyMetaWebhook));

router.post('/', asyncHandler(handleMetaWebhook));

module.exports = router;