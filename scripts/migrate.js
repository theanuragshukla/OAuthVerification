const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, '../db/migration.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf-8');

const db = require('../config/database.js')



const migrate = () => db.query(sql)
    .then(() => {
        console.log('Migration successful');
    })
    .catch((error) => {
        console.error('Migration failed:', error);
    }).finally(()=>{
      process.exit()
    });

migrate()

