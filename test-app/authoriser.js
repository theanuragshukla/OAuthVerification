require('dotenv').config()
const crypto = require('crypto')
const axios = require('axios')
const CLIENT_ID=process.env.CLIENT_ID
const CLIENT_SECRET=process.env.CLIENT_SECRET
const AUTH_SERVER_URL='http://localhost:3000/apps/get-id-token'
const AUTH_URL = "http://localhost:3000/apps/authorise"
const redirect = process.env.REDIRECT
const baseURL = process.env.ROOT
const jwt = require('jsonwebtoken')

const generateNonce = (len=16) => {
	const uid=crypto.randomBytes(len).toString('hex')
	return uid
}
const getcookie = (req) => { 
	const { headers: {cookie} } = req
	return cookie.split(';').reduce((res,item) => { 
		const data = item.trim().split('=')
		return { ...res, [data[0]] : data[1] }
	}, {})
} 
const requestIdToken = async (code) => {
	let idToken = null
	await axios.post(AUTH_SERVER_URL,{
		code:code,
		client_id:CLIENT_ID,
		client_secret:CLIENT_SECRET
	})
		.then(res=>{
			idToken = res.data.token
		})
		.catch(err=>{
			console.log(err)
		})
	return idToken
}
exports.getAuthURL = async(res) => {
	const nonce = generateNonce()
	const data = {
		client_id:CLIENT_ID,
		redirect :`${baseURL}${redirect}`,
		nonce : nonce,
		getBasicProfile:true,
		scopes:["fname", "lname", "email"]
	}
	var expiryDate = new Date(Number(new Date()) + 30000);
	res.setHeader("Set-Cookie", `nonce=${nonce};expires=${expiryDate}; Path=/;httpOnly`)
	let url = `${AUTH_URL}?${new URLSearchParams(data).toString()}`
	url=encodeURI(url)
	res.redirect(url)
}
exports.getToken =async (req)=>{
	const data = req.query
	const cookies = getcookie(req)
	if(cookies.nonce!==data.nonce){
		return ({status:false,msg:"unverfied nonce"})
	}
	const code = data.code
	const idToken = await requestIdToken(code)
	if(idToken===null){
		return ({status:false , msg:"authorisation code already used or expired"})
	}
	if(data.getBasicProfile=="true"){
		return({status:true,profile: this.getBasicProfile(idToken)})
	}
	return ({status:true,idToken:idToken})
}
exports.getBasicProfile=(idToken)=>{
	try{
		const data = jwt.verify(idToken,CLIENT_SECRET)
		data.status=true
		data.idToken=idToken
		return data
	}
	catch(e){
		return ({status:false,msg:"token expired"})
	}
}
