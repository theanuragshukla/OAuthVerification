const express = require('express')
const {getAllApps} = require('../../../../controllers/devController')
const router = express.Router()

router.get('/', getAllApps)
module.exports = router
