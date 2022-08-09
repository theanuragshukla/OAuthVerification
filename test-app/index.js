require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const PORT = process.env.PORT || 3001
const crypto = require('crypto')
const cookieParser = require('cookie-parser')

app.use(cookieParser())
app.use('/static',express.static(__dirname+'/static'))

app.get('/',(req,res)=>{
	res.status(200).sendFile(__dirname+'/index.html')
})

app.get('/auth/authoriser',(req,res)=>{
	const root = "http://localhost:3000"
	const nonce = generateNonce()
	const data = {
		client_id:"b14e0ed6-63cf-4ee3-bfbe-e38ab54c4feb",
		redirect : "http://localhost:3001/auth/verified",
		nonce : nonce

	}
	var expiryDate = new Date(Number(new Date()) + (3600000));
	res.setHeader("Set-Cookie", `nonce=${nonce};expires=${expiryDate}; Path=/;HttpOnly`)
	let url = `${root}/apps/authorise?${new URLSearchParams(data).toString()}`
	url=encodeURI(url)
	res.redirect(url)

})

app.get('/auth/verified',(req,res)=>{
	const data = req.query
	const cookies = req.cookies
	if(cookies.nonce!==data.nonce){
		res.status(403).json({status:false,msg:"unverfied nonce"})
		return
	}
	const code = data.code
	res.json({code:code})
})

const generateNonce = (len=4) => {
	const uid=crypto.randomBytes(len).toString('hex')
	return uid
}


http.listen(PORT,()=>{
	console.log(`listening on ${PORT}`)
})
