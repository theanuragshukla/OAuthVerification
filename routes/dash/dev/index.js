const express = require('express')
const router = express.Router()
const addNew = require('./addNew')
const allApps = require('./allApps')
router.get('/',(req,res)=>{
	res.render("dev")
})
router.use('/add-new-app',addNew)
router.use('/all-apps',allApps)
module.exports = router
