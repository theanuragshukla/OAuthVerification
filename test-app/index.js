require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const PORT = process.env.PORT || 3001
const {getToken, getAuthURL} = require('./authoriser')

app.use('/static',express.static(__dirname+'/static'))

app.get('/',(req,res)=>{
	res.status(200).sendFile(__dirname+'/index.html')
})

app.get('/auth/authoriser',(req,res)=>{
	getAuthURL(res)
})

app.get('/auth/verified',async(req,res)=>{
	const data = await getToken(req)
	if(data.status){
		res.json(data)
	}
	else{
		res.json(data)
	}
})

http.listen(PORT,()=>{
	console.log(`listening on ${PORT}`)
})
