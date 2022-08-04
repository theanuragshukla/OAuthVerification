require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;
const {engine} = require('express-handlebars')

app.use('/static',express.static(__dirname+'/static'));
app.set('view engine', 'hbs');

app.engine('hbs', engine({
	layoutsDir: __dirname + '/views/layouts',
	extname: 'hbs',
	defaultLayout:'main',
	partialsDir: __dirname + '/views/partials/'
}));


app.get('/',(req,res)=>{
	res.render("landing");
})
app.get('/login',(req,res)=>{
	res.render('home',{signupin:true,login:true});
})
app.get('/signup',(req,res)=>{
	res.render('home',{signupin:true,login:false});
})
http.listen(port,()=>{
	console.log(`server started on port ${port}`);
})
