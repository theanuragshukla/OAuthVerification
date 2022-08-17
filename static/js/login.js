const error = document.getElementById('error')
let qs,dump
function login(e){
	e.value="wait..."
	const email = document.getElementById('email')
	const pass = document.getElementById('pass')
	const data = {
		pass:pass.value,
		user:email.value
	}

	fetch('/let-me-in', {
		method: 'POST',
		headers: {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	})
		.then(res=>res.json())
		.then(res=>loginStatus(res,e))

}

window.onload=()=>{
	qs = window.location.href.split('?')[1] || ''
	dump =qs && qs.indexOf('dump')>0 ? decodeURIComponent(qs.split("dump=")[1].split("&")[0]) : '/'
}

const loginStatus =(res,btn)=>{
	if(res.status){
		btn.value="redirecting..."
		location.href=`${dump}?${qs}`
	}
	else{
		btn.value="try again"
	}
}
