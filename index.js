require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const {engine} = require('express-handlebars')
const cookieParser=require('cookie-parser')
const crypto = require('crypto')
const {randomUUID:uuid} = require('crypto')
const db = require("./config/database")
const bcrypt = require("bcryptjs")
const saltRounds=10
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET_KEY
const redis = require('redis')
const authDB = redis.createClient()
authDB.connect()
authDB.on('connect',()=>{
	console.log('redis ready')
})
const excludedRoutes = ['/apps/authorise','/','/login','/signup','/let-me-in','/add-new-user','/checkDup','/checkAuth','/get-id-token']
app.use('/static',express.static(__dirname+'/static'));
app.use(cookieParser());
app.use(async (req, res, next) => {
	const url = req.originalUrl.split("?")[0]
	if(excludedRoutes.includes(url)){
		next()
	}else{
		const token = req.cookies.token
		const authData = await verifyToken(token)
		if (!authData.result){
			if(req.method=="GET")
				res.redirect(`http://${req.header('host')}`)
			else
				res.status(401).json({status:false,msg:"unauthorised access"})
			return
		}
		else{
			req.usrProf = authData.data
			next()
		}
	}})

app.set('view engine', 'hbs');
app.use(express.json());                                                                           app.use(express.urlencoded({
	extended: true
}));
app.engine('hbs', engine({
	layoutsDir: __dirname + '/views/layouts',
	extname: 'hbs',
	defaultLayout:'main',
	partialsDir: __dirname + '/views/partials/'
}));

const generateUid = (len=16) => {
	const uid=crypto.randomBytes(len).toString('hex')
	return uid
}

app.get('/',(req,res)=>{
	res.render("landing");
})
app.get('/login',(req,res)=>{
	res.render('home',{signupin:true,login:true,script:"login.js"});
})
app.get('/signup',(req,res)=>{
	res.render('home',{signupin:true,login:false,script:"signup.js"});
})
app.get('/apps/authorise',async (req,res)=>{
	const data = req.query
	const token = req.cookies.token
	const authData = await verifyToken(token)
	if (!authData.result){
		data.dump='/apps/authorise'
		const qs =new URLSearchParams(data).toString()
		res.redirect(`/login?${qs}`)
		return
	}
	else{
		const query = `SELECT appid FROM appauth WHERE client_id = $1;`
		const values = [data.client_id]
		let dbRes={rows:[]}
		try{
			dbRes =await db.query(query,values)}
		catch(e){
			res.status(403).json({status:false,msg:"invalid credentials"})
			return
		}
		const rows = dbRes.rows
		if(rows.length<=0){
			res.status(403).json({status:false,msg:"invalid credentials"})
			return
		}
		const appid = rows[0].appid
		const appDataQuery = `SELECT * FROM apps WHERE appid = $1`
		let appData
		try{
			appData=await db.query(appDataQuery,[appid])
		}catch(e){
			res.status(403).json({status:false,msg:"invalid app credentials"})
			return
		}
		const app = appData.rows[0]
		if(app.redirect !== decodeURIComponent(data.redirect)){
			res.status(403).json({status:false,msg:"invalid app credentials"})
			return
		}
		const authCode=generateUid(32)
		const retqs = {
			code:authCode,
			nonce:data.nonce,
			getBasicProfile:data.getBasicProfile
		}

		authDB.hSet(authCode,{appid:appid,user:authData.data.uid})
		authDB.expire(authCode,300)
		res.redirect(`${app.redirect}?${new URLSearchParams(retqs).toString()}`)
		return

	}
})
app.post('/create-new-app',async(req,res)=>{
	const query = `
	INSERT INTO apps (appname,origin,redirect,uid,appid) 
	VALUES($1,$2,$3,$4,$5)
	RETURNING *;
	`;
	const appid=generateUid(16)
	const values = [req.body.name,req.body.origin,req.body.redirect,req.usrProf.uid,appid];
	const { rows } = await db.query(query, values)
	const secretQuery = `
	INSERT INTO appauth (appid,client_id,client_secret) 
	VALUES($1,$2,$3)
	RETURNING *;
	`;
	const client_id=uuid()
	var client_secret=generateUid(32)
	console.log(client_id)
	console.log(client_secret)
	await bcrypt.hash(client_secret,saltRounds).then(function(hash) {
		client_secret=hash
	});

	const secretValues = [appid,client_id,client_secret];
	const secretRows = await db.query(secretQuery, secretValues)
	res.status(200).json({status:true})
})
app.post("/let-me-in",async (req,res)=>{
	const query = `
	SELECT * FROM users WHERE email = $1;`;
	const values = [req.body.email];
	const { rows } = await db.query(query, values);
	if(rows.length==0){
		res.send({status:false,result:"wrong email or password"})
	}else{
		const match = await bcrypt.compare(req.body.pass, rows[0].pass)
		if(match){
			const token = jwt.sign({
				data:rows[0].uid
			}, secret, { expiresIn: '7d' })
			var expiryDate = new Date(Number(new Date()) + (7*24*3600000));
			res.setHeader("Set-Cookie", `token=${token};expires=${expiryDate}; Path=/;HttpOnly`)

			res.send({status:true})
		}
		else{
			res.send({status:false,result:"wrong username or password"})
		}
	}
})


app.post("/add-new-user",async (req,res)=>{
	const emailquery = `
	SELECT * FROM users WHERE email = $1;
	`;
	const emailvalues = [req.body.email];
	const dupEmail = await db.query(emailquery, emailvalues);
	if( dupEmail.rows.length!=0){
		res.send({status:false,email:true,result:"email exists"})
		return
	}
	const query = `
	INSERT INTO users (fname,lname,email,pass,uid) 
	VALUES($1,$2,$3,$4,$5)
	RETURNING *;
	`;
	var passhash
	await bcrypt.hash(req.body.pass, saltRounds).then(function(hash) {
		passhash=hash
	});
	const values = [req.body.fname,req.body.lname,req.body.email,passhash,generateUid()];
	const { rows } = await db.query(query, values)
	console.log(rows[0])
	res.send({status:true})
})

app.get('/checkAuth',async (req,res)=>{
	const token = req.cookies.token
	const authData = await verifyToken(token)
	res.status(200).json({result:authData.result,data:
		authData.result ? 
		{
			fname:authData.data.fname,
			lname:authData.data.lname,
			username:authData.data.username,
			email:authData.data.email,
		}
		:{}
	})
})

app.post('/get-id-token',async (req,res)=>{
	const code = req.body.code
	const cid = req.body.client_id
	const csec = req.body.client_secret
	const authData = JSON.parse(JSON.stringify(await authDB.hGetAll(code)))
	authDB.del(code)
	const query = `SELECT * FROM appauth WHERE appid = $1`
	const values = [authData.appid]
	const {rows} = await db.query(query,values)
	if(rows.length<1){
		res.status(403).json({status:false,msg:"invalid auth code"})
		return
	}
	if(rows[0].client_id==cid){
		const match =bcrypt.compareSync(csec, rows[0].client_secret)
		if(match){
			const usrQuery = `SELECT * FROM users WHERE uid = $1`
			const {rows} = await db.query(usrQuery,[authData.user])
			const usrData = rows[0]
			const info2send = {
				fname:usrData.fname,
				lname:usrData.lname,
				email:usrData.email,
				aud:cid,
			}
			const idToken = jwt.sign(info2send, csec,{expiresIn:600})
			res.status(200).json({token:idToken})
		}else{
			res.status(403).json({status:false,msg:"wrong client_secret"})
		}
	}else{
		res.status(403).json({status:false,msg:"wrong client_id"})
	}
})

app.post('/checkDup', async (req,res)=>{
	const toCheck=req.body.email ? "email" : "username"
	const query = `SELECT * FROM users WHERE ${toCheck} = $1;`;
	const value = [req.body.data];
	const dups = await db.query(query, value);
	if( dups.rows.length!=0){
		res.status(200).send({status:false})
		return
	}else 
		res.status(200).send({status:true})

})

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

http.listen(port,()=>{
	console.log(`server started on port ${port}`);
})
