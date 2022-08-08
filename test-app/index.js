require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const PORT = process.env.PORT || 3001

app.use('/static',express.static(__dirname+'/static'))

app.get('/',(req,res)=>{
	res.status(200).sendFile(__dirname+'/index.html')
})


http.listen(PORT,()=>{
	console.log(`listening on ${PORT}`)
})
