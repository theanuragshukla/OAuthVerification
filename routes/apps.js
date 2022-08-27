const express = require('express')
const router = express.Router()
const {randomUUID:uuid} = require('crypto')
const {checklen, checkSpaces} = require('some-random-form-validator')
const {resolveToken, generateUid} = require('../utils')
const db = require("../config/database")
const bcrypt = require("bcryptjs")
const saltRounds=10
const redis = require('redis')
const authDB = redis.createClient()
authDB.connect()
authDB.on('connect',()=>{
	console.log('redis ready')
})

router.use(resolveToken)

router.get('/authorise',async (req,res)=>{
    const data = req.query
    const token = req.cookies.token
    const authData = await verifyToken(token)
    if (!authData.result){
        data.dump='/apps/authorise'
        const qs =new URLSearchParams(data).toString()
        res.redirect(`/auth/login?${qs}`)
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
router.post('/create-new-app',async(req,res)=>{
	const {name, origin, redirect } = req.body
	if(!checkSpaces(name,true) || !checklen(6,50,name)){
		res.status(400).json({status:false,error:"name",msg:"Invalid app name"})
		return
	}
	if(origin==null || origin==undefined || !checklen(6,200,origin)){
		res.status(400).json({status:false,error:"origin" , msg:"Invalid origin URI"})
		return
	}
	if(redirect==null || redirect==undefined || !checklen(6,200, redirect)){
		res.status(400).json({status:false, error:"redirect",msg:"Invalid redirect URI"})
		return
	}
	const dupquery = `SELECT * FROM apps WHERE appname = $1 and uid = $2 ;`;
	const dupvalue = [req.body.name,req.usrProf.uid];
    const dups = await db.query(dupquery, dupvalue);
    if( dups.rows.length!=0){
        res.status(401).json({status:false,msg:"app name already in use"})
        return
    }
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
    await bcrypt.hash(client_secret,saltRounds).then(function(hash) {
        client_secret=hash
    });
    const secretValues = [appid,client_id,client_secret];
    const secretRows = await db.query(secretQuery, secretValues)
    res.status(200).json({status:true})
})
router.post('/get-id-token',async (req,res)=>{
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


module.exports = router
