require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const {engine} = require('express-handlebars')
const cookieParser=require('cookie-parser')
const crypto = require('crypto')
const db = require("./config/database")
const bcrypt = require("bcryptjs")
const saltRounds=10
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET_KEY

app.use('/static',express.static(__dirname+'/static'));
app.set('view engine', 'hbs');
app.use(cookieParser());
app.use(express.json());                                                                           app.use(express.urlencoded({
	extended: true
}));
app.engine('hbs', engine({
	layoutsDir: __dirname + '/views/layouts',
	extname: 'hbs',
	defaultLayout:'main',
	partialsDir: __dirname + '/views/partials/'
}));

const generateUid = () => {
	const uid=crypto.randomBytes(16).toString('hex')
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
