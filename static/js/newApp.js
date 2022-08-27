const createApp=async(e)=>{
	e.value="wait..."
	const name = document.getElementById('appName')
	const origin = document.getElementById('trustedOrigin')
	const redirect = document.getElementById('redirectUri')

	const data = {
		name:name.value,
		origin:origin.value,
		redirect:redirect.value
	}
	if(await validateData(data) === false){
		e.value='Try again'
		return
	}
	fetch('/apps/create-new-app', {
		method: 'POST',
		crossdomain: true,
		withCredentials:'include',

		headers: {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	})
		.then(res=>res.json())
		.then((res)=>{
			["name", "origin", "redirect"].map(key=>{
				const e = document.querySelector(`[data-error="${key}"]`)
				if(res.status){
					e.style.visibility="hidden"
				}else{
					if(res.error!==key){
						e.style.visibility="hidden"
					}else{
						e.getElementsByTagName("span")[0].innerHTML=res.msg
						e.style.visibility="visible"
					}
				}
			})
			if(res.status===true){
				e.value="Redirecting..."
				location.href='/'
			}else if (res.status===false){
				e.value='Try again'
			}
		})
}
const validateData =async (data) => {
	const {name,redirect,origin} = data
	const errors = {
		name:name!=null && name!=undefined && checkName(name),
		redirect:redirect!=null && redirect!=undefined && checklen(6,200,redirect),
		origin:origin!=null && origin!=undefined && checklen(6,200,origin),
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
