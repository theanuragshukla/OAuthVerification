const signupBtn = document.getElementById("signupBtn")
const fname  = document.getElementById('fname')
const lname  = document.getElementById('lname')
const email = document.getElementById('email')
const pass = document.getElementById('pass')
const confirmPass = document.getElementById('confirmPass')
const error = document.getElementById('error')

const signup=async()=>{
	const data = {
		fname:fname.value,
		lname:lname.value,
		email:email.value,
		pass:pass.value,
	}
	if(await checkAll(data)){
		fetch('/add-new-user', {
			method: 'POST',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
			.then(res=>res.json())
			.then(res=>{
				if(res.status){
					location.href='/'
				}else{
					alert("some error occoured")
					location.href='/'
				}
			})
	}
	else {
		alert("error")
	}


}
const validateOnSpot =async (state) => {
	if(state==1){
		const res = checkName(fname.value)
		error.innerHTML=res ? "" : "enter a valid name"
		validateStatus(res)
		return res
	}
	else if(state==2){
		const resEmail = checkPass(email.value)
		error.innerHTML="enter a valid email"
		validateStatus(resEmail)
		return resEmail
	}else if(state==3){
		const resPass = checkPass(pass.value)
		error.innerHTML=resPass ? "" : "enter a valid password"
		validateStatus(resPass)
		return resPass
	}
}

const validateStatus =(status)=>{
	error.style.display=!status ? "initial" :"none"
}
