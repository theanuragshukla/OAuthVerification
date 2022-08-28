const express = require('express')
const router = express.Router()
const dev = require('./dev')

router.get('/',(req,res)=>{
	res.render("landing")
})
router.use('/dev',dev)
module.exports = router
