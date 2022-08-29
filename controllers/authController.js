const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs")
const db = require("../config/database")
const saltRounds=10
const secret = process.env.JWT_SECRET_KEY
const {verifyToken, generateUid} = require('../utils')
const {checkPass, checkName, checkEmail} = require('some-random-form-validator');

const loginGet = async (req,res)=>{
	const qs = req.query
	const dump =qs && qs.dump ? (qs.dump) : '/'
	const token = req.cookies.token
	const authData = await verifyToken(token)
	if (authData.result){
		res.redirect(`${dump}${qs ? '?'+(new URLSearchParams(qs).toString()):''}`)
		return
	}
	res.render('home',{signupin:true,login:true,script:"login.js"});
}

const signupGet = async (req,res)=>{
	const qs = req.query
	const dump =qs && qs.dump ? (qs.dump) :  '/'
	const token = req.cookies.token
	const authData = await verifyToken(token)
	if (authData.result){
		res.redirect(`${dump}${qs ? '?'+(new URLSearchParams(qs).toString()):''}`)
		return
	}
	res.render('home',{signupin:true,login:false,script:"signup.js"});
}
const loginPost = async (req,res)=>{
	const query = `SELECT * FROM users WHERE email = $1;`;
	const values = [req.body.email];
	const { rows } = await db.query(query, values);
	if(rows.length==0){
		res.send({status:false,msg:"Wrong email or password"})
	}else{
		const match = await bcrypt.compare(req.body.pass, rows[0].pass)
		if(match){
			const token = jwt.sign({data:rows[0].uid}, secret, { expiresIn: '7d' })
			const expiryDate = new Date(Number(new Date()) + (7*24*3600000));
			res.setHeader("Set-Cookie", `token=${token};expires=${expiryDate}; Path=/;HttpOnly`)
			res.status(200).send({status:true})
			return
		}
		else{
			res.send({status:false,msg:"wrong username or password"})
		}
	}
}
const signupPost = async(req,res)=>{
	const {email,pass,fname,lname} = req.body
	if(!checkEmail(email)){
		res.status(400).json({status:false,msg:"invalid email"})
		return
	}
	if(!checkPass(pass)){
		res.status(400).json({status:false,msg:"unsafe password"})
		return
	}
	if(!checkName(fname)){
		res.status(400).json({status:false,msg:"invalid name"})
		return
	}
	const emailquery = `
	SELECT * FROM users WHERE email = $1;
	`;
	const emailvalues =[email];
	const dupEmail = await db.query(emailquery, emailvalues);
	if( dupEmail.rows.length!=0){
		res.send({status:false,email:true,msg:"email exists"})
		return
	}
	const query = `
	INSERT INTO users (fname,lname,email,pass,uid) 
	VALUES($1,$2,$3,$4,$5)
	RETURNING *;
	`;
	var passhash
	await bcrypt.hash(pass, saltRounds).then(function(hash) {
		passhash=hash
	});
	const uid = generateUid()
	const values = [fname,lname,email,passhash,uid];
	const { rows } = await db.query(query, values)
	console.log(rows[0])
	const token = jwt.sign({data:uid}, secret, { expiresIn: '7d' })
	const expiryDate = new Date(Number(new Date()) + (7*24*3600000));
	res.setHeader("Set-Cookie", `token=${token};expires=${expiryDate}; Path=/;HttpOnly`)
	res.status(200).json({status:true})
}
const checkDup =  async (req,res)=>{
	const toCheck=req.body.email ? "email" : "username"
	const query = `SELECT * FROM users WHERE ${toCheck} = $1;`;
	const value = [req.body.data];
	const dups = await db.query(query, value);
	if( dups.rows.length!=0){
		res.status(200).send({status:false})
		return
	}else 
		res.status(200).send({status:true})
}
const checkAuth = async (req,res)=>{
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
}

module.exports = {
	loginGet,
	loginPost,
	signupGet,
	signupPost,
	checkDup,
	checkAuth
}
