require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http').Server(app)
const port = process.env.PORT || 3000
const {engine} = require('express-handlebars')
const cookieParser=require('cookie-parser')
const {resolveToken} = require('./utils')
const authRouter = require('./routes/auth')
const appsRouter = require('./routes/apps')
const dashRouter = require('./routes/dash')

app.use('/static',express.static(__dirname+'/static'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({
	extended: true
}))
app.set('view engine', 'hbs')
app.engine('hbs', engine({
	layoutsDir: __dirname + '/views/layouts',
	extname: 'hbs',
	defaultLayout:'main',
	partialsDir: __dirname + '/views/partials/'
}))

app.use('/auth',authRouter)
app.use('/apps',appsRouter)
app.use(resolveToken)
app.use('/',dashRouter)

http.listen(port,()=>{
	console.log(`server started on port ${port}`)
})
