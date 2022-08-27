require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const port = process.env.PORT || 3000
const {engine} = require('express-handlebars')
const cookieParser=require('cookie-parser')
const redis = require('redis')
const authDB = redis.createClient()
authDB.connect()
authDB.on('connect',()=>{
	console.log('redis ready')
})
const {resolveToken} = require('./utils')
const authRouter = require('./routes/auth')
const appsRouter = require('./routes/apps')

app.use('/static',express.static(__dirname+'/static'))
app.use(cookieParser())
app.use(express.json())
app.set('view engine', 'hbs')
app.use(express.urlencoded({
	extended: true
}));
app.engine('hbs', engine({
	layoutsDir: __dirname + '/views/layouts',
	extname: 'hbs',
	defaultLayout:'main',
	partialsDir: __dirname + '/views/partials/'
}));

app.use('/auth',authRouter)
app.use('/apps',appsRouter)
app.use(resolveToken)
app.get('/',(req,res)=>{
	res.render("landing")
})

http.listen(port,()=>{
	console.log(`server started on port ${port}`)
})
