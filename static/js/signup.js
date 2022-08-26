const signupBtn = document.getElementById("signupBtn")
const fname  = document.getElementById('fname')
const lname  = document.getElementById('lname')
const email = document.getElementById('email')
const pass = document.getElementById('pass')
const confirmPass = document.getElementById('confirmPass')
const signup=async()=>{
	const data = {
		fname:fname.value,
		lname:lname.value,
		email:email.value,
		pass:pass.value,
		confirmPass:confirmPass.value
	}	
	if(await validateData(data) === false){
		return
	}
	if(checkAll(data)){
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
					alert(res.msg)
				}
			})
	}
	else {
		alert("error")
	}
}
const validateData =async (data) => {
	const {fname,lname, email, pass, confirmPass} = data
	const errors = {
		fname:checkName(fname),
		lname:checkName(lname),
		email:checkEmail(email),
		pass:checkPass(pass),
		confirmPass:(pass===confirmPass)
	}
	Object.keys(errors).map(key=>{
		const e = document.querySelector(`[data-error="${key}"]`)
		if(errors[key]===true){
			e.style.visibility="hidden"
		}else{
			e.style.visibility="visible"
		}
	})
	return !Object.values(errors).includes(false)
}
