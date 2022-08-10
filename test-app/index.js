require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const PORT = process.env.PORT || 3001
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
const axios = require('axios')
const CLIENT_ID=process.env.CLIENT_ID
const CLIENT_SECRET=process.env.CLIENT_SECRET
const AUTH_SERVER_URL='http://localhost:3000/exchange-token'
app.use(cookieParser())
app.use('/static',express.static(__dirname+'/static'))

app.get('/',(req,res)=>{
	res.status(200).sendFile(__dirname+'/index.html')
})

app.get('/auth/authoriser',(req,res)=>{
	const root = "http://localhost:3000"
	const nonce = generateNonce()
	const data = {
		client_id:CLIENT_ID,
		redirect : "http://localhost:3001/auth/verified",
		nonce : nonce

	}
	var expiryDate = new Date(Number(new Date()) + 300000);
	res.setHeader("Set-Cookie", `nonce=${nonce};expires=${expiryDate}; Path=/;HttpOnly`)
	let url = `${root}/apps/authorise?${new URLSearchParams(data).toString()}`
	url=encodeURI(url)
	res.redirect(url)

})

app.get('/auth/verified',async(req,res)=>{
	const data = req.query
	const cookies = req.cookies
	if(cookies.nonce!==data.nonce){
		res.status(403).json({status:false,msg:"unverfied nonce"})
		return
	}
	const code = data.code
	const info = await requestToken(code) || {}
	res.json(info)
})

const generateNonce = (len=4) => {
	const uid=crypto.randomBytes(len).toString('hex')
	return uid
}

const requestToken = async (code) => {
	await axios.post(AUTH_SERVER_URL,{
		code:code,
		client_id:CLIENT_ID,
		client_secret:CLIENT_SECRET
	})
	.then(res=>console.log(res.data))
}

http.listen(PORT,()=>{
	console.log(`listening on ${PORT}`)
})
