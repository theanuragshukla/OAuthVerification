const express = require('express')
const router = express.Router()

router.get('/', (req, res)=>{
	res.render('allApps')
})

module.exports = router
