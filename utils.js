const crypto = require('crypto')
const db = require("./config/database")
const secret = process.env.JWT_SECRET_KEY
const jwt = require('jsonwebtoken')

const excludedRoutes = ['/apps/authorise','/auth/let-me-in','/auth/add-new-user','/auth/checkDup','/auth/checkAuth','/apps/get-id-token']

const verifyToken = async (authToken)=>{
	try{
		const payload = jwt.verify(authToken, secret)
		const query = `SELECT * FROM users WHERE uid = $1;`;
		const values = [payload.data];
		const { rows } = await db.query(query, values)
		if(rows.length==0){
			return {result:false}
		}else{
			return {result:true,data:rows[0],uid:payload.data}
		}
	}catch(e){
		return {result:false}
	}
}
const generateUid = (len=16) => {
	const uid=crypto.randomBytes(len).toString('hex')
	return uid
}

const resolveToken = async (req, res, next) => {
	const url = req.originalUrl.split("?")[0]
	if(excludedRoutes.includes(url)){
		next()
	}else{
		const token = req.cookies.token
		const authData = await verifyToken(token)
		if (!authData.result){
			if(req.method=="GET"){
				res.redirect(`http://${req.header('host')}/auth/login`)
			} else{
				res.status(401).json({status:false,msg:"unauthorised access"})
			}
			return
		}
		else{
			req.usrProf = authData.data
			next()
		}
	}}

module.exports = {
	verifyToken, generateUid, resolveToken
}
