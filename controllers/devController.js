const db = require('../config/database')
const getAllApps = async (req,res) => {
	const uid = req.usrProf.uid
	const query = `SELECT * FROM apps WHERE uid = $1;`
	const values = [uid]
	const {rows} = await db.query(query,values)
	console.log(rows)
	res.render('allApps', {data:rows ? rows : []})
}

module.exports = {
	getAllApps
}
