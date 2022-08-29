const express = require('express')
const {resolveToken} = require('../../utils')
const router = express.Router()
const dev = require('./dev')
const profile = require('./profile')

router.use(resolveToken)
router.get('/',(req,res)=>{
	res.render("landing")
})
router.use('/dev',dev)
router.use('/profile', profile)

module.exports = router
