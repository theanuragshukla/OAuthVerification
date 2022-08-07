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

	fetch('/create-new-app', {
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
			alert(res.status ? "done" : "error")
			e.value="Create"
		})
}
