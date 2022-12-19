const express = require('express')
const router = express.Router()
const db = require("../../../config/database")

router.get('/', async (req, res)=>{
	const uid = req.usrProf.uid
	const query = `SELECT fname, lname, email FROM users WHERE uid = $1;`
	const value = [uid]
	const {rows} = await db.query(query, value)
	if(rows.length==0){
		res.status(400).redirect('/auth/login')
		return
	}
	res.render('profile', {data:rows[0], script:"profile.js", style:"profile.css"})
})

module.exports = router
