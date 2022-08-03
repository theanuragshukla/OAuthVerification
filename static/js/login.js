const error = document.getElementById('error')

function login(e){
	e.innerText="wait..."
	const user = document.getElementById('user')
	const pass = document.getElementById('pass')

	const data = {
		pass:pass.value,
		user:user.value
	}

fetch('/let-me-in', {
  method: 'POST',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify( {
		pass:pass.value,
		"user":user.value
		})
})
	.then(res=>res.json())
	.then(res=>loginStatus(res,e))
	
}

window.onload=()=>{
	const verify =async ()=>{
		await fetch('/checkAuth', {
			method: 'GET',
			crossdomain: true,
			withCredentials:'include'
		})
			.then(res => res.json())
			.then(res =>manageAuth(res))
	}
	const manageAuth=(val)=>{
		if(val.result){
		location.href=`https://whatsappweird.herokuapp.com/auth/verify?token=${res.token}`
		}
	}
	verify()

}

const loginStatus =(res,btn)=>{
	error.style.display=!res.status ? "initial" :"none"
	if(res.status){
		btn.innerText="redirecting..."
		location.href=`https://whatsappweird.herokuapp.com/auth/verify?token=${res.token}`
	}
	else{
		btn.innerText="try again"
	}
}
