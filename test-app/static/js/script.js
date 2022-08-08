const login = () => {
	const root = "http://localhost:3000"
	const client_id="b14e0ed6-63cf-4ee3-bfbe-e38ab54c4feb"
	const redirect = "http://localhost:3001/auth/verified"
	const nonce = 23
	let url = `${root}/apps/authorise?client_id=${client_id}&redirect=${redirect}&nonce=${nonce}`
	url=encodeURI(url)
	location.href=url
}
