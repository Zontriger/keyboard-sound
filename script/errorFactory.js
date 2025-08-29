// Creación de error personalizado para distinguirlo 
// de otro errores de JavaScript.
export default function errorFactory(name) {
	return class CustomError extends Error {
		constructor(message) {
			super(message);
			this.name = name;
		}
	}
}