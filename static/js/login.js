const error = document.getElementById('error')
let qs,dump
async function login(e){
	e.value="wait..."
	const email = document.getElementById('email')
	const pass = document.getElementById('pass')
	const data = {
		pass:pass.value,
		email:email.value
	}
	if(await validateData(data)===false){
		e.value="try again"
		return
	}
	fetch('/auth/let-me-in', {
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
		alert(res.msg)
		btn.value="try again"
	}
}
const validateData =async (data) => {
	const {email, pass} = data
	const errors = {
		email:email!=undefined && email!=null && checkEmail(email),
		pass:pass!=null && pass!=undefined && checkPass(pass),
	}
	Object.keys(errors).map(key=>{
		const e = document.querySelector(`[data-error="${key}"]`)
		if(errors[key]===true){
			e.style.visibility="hidden"
		}else{
			e.style.visibility="visible"
		}
	})
	const status = !Object.values(errors).includes(false)
	return status
}
