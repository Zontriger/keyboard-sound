// Solicita un recurso de red mediante fetch
export default async function load(url, errorMessage) {
	try {
		const resHTTP = await fetch(url);
		if (!resHTTP.ok) throw new Error(`HTTP[${resHTTP.status} ${resHTTP.statusText}]`);
		
		const resData = await resHTTP.json();
		return resData;
	} catch(e) {
		throw new Error(e.message);
	}
}	