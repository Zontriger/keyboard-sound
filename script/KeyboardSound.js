import load from "./load.js";
import errorFactory from "./errorFactory.js";

const KeyboardSoundError = errorFactory("KeyboardSoundError");
const KeyboardSoundValidateError = errorFactory("KeyboardSoundValidateError");

class KeyboardSound {
	// URL con el JSON de los audios
	#audiosURL = "keyboard-sounds.json"; 
	
	// Propiedades de control
	#isAudiosLoaded = false;
	#isPlayed = false;
	
	// Propiedades de instancia
	#currentTypeKeyboardSound;
	#path;
	#typeKeyboardSounds;
	#typeKeyboardSoundDefault;
	#typeKeys;
	#typeKeyPref;
	#files;
	
	// Asignación del tipo de tecla presionada
	// en función del tipo de input detectado por 
	// el evento 'input' sobre el elemento escuchador.
	// Importante: El nombre de tecla sirve para indicar 
	// el archivo de audio correspondiente según su tipo 
	// de tecla.
	static #inputTypeKey = {
		insertLineBreak: "enter",
		deleteContentForward: "backspace",
		deleteContentBackward: "backspace",
		insertText: {
			" ": "space"
		}
	}
	
	// Mensajes de errores centralizados predefinidos
	static #ERROR_MESSAGE = {
		// KeyboardSoundError
		NOTARGETKEYLISTENER: "targetKeyListener is required.",
		TARGETKEYLISTENERINVALID: "Invalid targetKeyListener.",
		AUDIOSURLINVALID: "Invalid Audios URL.",
		AUDIOSNOFETCHED: "Audios not fetched from the network.",
		AUDIOSNOLOADED: "Audios were not loaded.",
		TYPEKEYBOARDSOUNDINVALID: "Invalid type key sound.",
		TYPEKEYINVALID: "Invalid type key.",
		FILEPATHINVALID: "Invalid file path.",
		AUDIOPLAYBACKERROR: "Audio playback error.",
		
		// KeyboardSoundValidateError
		INVALIDAUDIOSJSON: "Invalid Audios JSON.",
		INVALIDPATH: "Invalid path.",
		INVALIDTYPEKEYBOARDSOUNDS: "Invalid type keyboard sounds.",
		INVALIDTYPEKEYBOARDSOUNDDEFAULT: "Invalid type keyboard sound default.",
		INVALIDTYPEKEYS: "Invalid type keys.",
		INVALIDTYPEKEYPREF: "Invalid type key pref.",
		INVALIDAUDIOS: "Invalid audios files.",
	}
	
	// Al crear una instancia se debe ingresar un 
	// elemento el cual será el escuchador de las 
	// teclas, que al presionarse sobre él, ejecutará
	// el sonido de la tecla (detección de evento: 'input')
	constructor(targetKeyListener, audiosURL = this.#audiosURL) {
		if (!targetKeyListener) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.NOTARGETKEYLISTENER);
		if (targetKeyListener !== document && !(targetKeyListener instanceof Node)) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.TARGETKEYLISTENERINVALID);

		Object.freeze(KeyboardSound.#ERROR_MESSAGE);
		this.target = targetKeyListener;
		this.audiosURL = audiosURL;
	}
	
	// Se encarga de validar los datos del JSON recibido,
	// arrojando un error en caso de un mal formato.
	#validateAudiosJSON(Audios) {
		const msg = KeyboardSound.#ERROR_MESSAGE;
		
		if (typeof Audios.path !== "string" || !Audios.path.length) {
			throw new KeyboardSoundValidateError(msg.INVALIDPATH);
		}
		if (!Object.keys(Audios.files).includes(Audios.typeKeyboardSoundDefault)) {
			throw new KeyboardSoundValidateError(msg.INVALIDTYPEKEYBOARDSOUNDDEFAULT);
		}
		if (!Object.keys(Audios.files[Audios.typeKeyboardSoundDefault]).includes(Audios.typeKeyPref)) {
			throw new KeyboardSoundValidateError(msg.INVALIDTYPEKEYPREF);
		}
		
		for (const keys of Object.values(Audios.files)) {
			for (const files of Object.values(keys)) {
				if (!Array.isArray(files) || !files.length) {
					throw new KeyboardSoundValidateError(msg.INVALIDAUDIOS);
				}
				for (const file of files) {
					if (typeof file !== "string" || !file.length) {
						throw new KeyboardSoundValidateError(msg.INVALIDAUDIOS);
					}
				}
			}
		}
	}
	
	// Carga del JSON con la información necesaria para ejecutar 
	// la funcionalidad de KeyboardSound, además de su validación.
	async loadAudios(audiosURL = this.#audiosURL) {
		this.audiosURL = audiosURL;
		try {
			const Audios = await load(audiosURL);
			
			this.#validateAudiosJSON(Audios)
			
			this.#path = Audios.path;
			this.#files = Audios.files;
			this.#currentTypeKeyboardSound = Audios.typeKeyboardSoundDefault;
			this.#typeKeyboardSounds = Object.keys(Audios.files);
			this.#typeKeyboardSoundDefault = Audios.typeKeyboardSoundDefault;
			this.#typeKeys = Object.keys(this.#files[this.#currentTypeKeyboardSound]);
			this.#typeKeyPref = Audios.typeKeyPref;
			this.#isAudiosLoaded = true;
		} catch(e) {
			if (e instanceof KeyboardSoundValidateError) {
				throw new KeyboardSoundValidateError(KeyboardSound.#ERROR_MESSAGE.INVALIDAUDIOSJSON + ` ${e.message}`);
			}
			if (e instanceof KeyboardSoundError) {
				throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOFETCHED);
			}
			throw new Error(e);
		}
	}
	
	// Lógica de reproducción del audio de la tecla en función 
	// del tipo de sonido de tecla, tipo de tecla y validaciones.
	#handleKeyListener = (event) => {
		const audio = new Audio();
		
		// Ruta a los audios, tipo de sonido de teclado actual
		const path = this.#path;
		const typeKeyboardSound = this.#currentTypeKeyboardSound;
		let key = KeyboardSound.#inputTypeKey[event.inputType];
		
		// Si se detectó un input que no es de tecleada, no suena
		if (!event.inputType) return;
		
		// Si la tecla es un carácter y es uno definido, 
		// lo asigna a key, si no está definido, asigna 
		// el tipo de tecla por preferencia.
		if (event.inputType === "insertText") {
			key = key[event.data];
			if (!key) key = this.#typeKeyPref;
		}
		
		// Si no es un carácter y no pertenece a las teclas 
		// definidas según su tipo de sonido de teclado, asigna 
		// el tipo de tecla por preferencia.
		if (!this.#typeKeys.includes(key)) {
			key = this.#typeKeyPref;
		}
		
		// Define el array de rutas de archivos de audio, y 
		// evalúa si realmente existe dado los atributos.
		const files = this.#files?.[typeKeyboardSound]?.[key];
		
		if (!files) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.FILEPATHINVALID);
		
		// Selecciona un archivo de audio según un índice pseudoaleatorio,
		// formatea la ruta y lo asigna como ruta del objeto Audio.
		const randomIndex = Math.floor(Math.random() * files.length);
		const file = files[randomIndex];
		audio.src = `${path}/${typeKeyboardSound}/${file}`;
		
		// De haber algún problema con la ejecución del audio, muestra el 
		// error en la consola.
		const audioPromise = audio.play();
		
		if (!audioPromise) return;
		
		audioPromise.catch(e => {
			if (e.name !== "AbortError") {
				throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOPLAYBACKERROR + ` ${e}.`);
			}
		});
	}
	
	// Inicia el escuchador al elemento, detectando 
	// cambios en input, referenciando la función con 
	// la función vinculada a la instancia del objeto
	// de la clase.
	play() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		if (this.#isPlayed) return;
		
		this.target.addEventListener("input", this.#handleKeyListener);
		this.#isPlayed = true;
	}
	
	// Detiene al escuchador del elemento
	stop() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		if (!this.#isPlayed) return;
		
		this.target.removeEventListener("input", this.#handleKeyListener);
		this.#isPlayed = false;
	}
	
	// Cambia de sonido de teclado, validando que 
	// este exista de entre los recibidos en el JSON
	changeSound(typeKeyboardSound) {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		if (!this.#typeKeyboardSounds.includes(typeKeyboardSound)) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.TYPEKEYBOARDSOUNDINVALID);
		
		this.#currentTypeKeyboardSound = typeKeyboardSound;
		this.#typeKeys = Object.keys(this.#files[this.#currentTypeKeyboardSound]);
	}
	
	get audiosURL() {
		return this.#audiosURL;
	}
	
	set audiosURL(value) {
		if (typeof value !== "string" || value === "") throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSURLINVALID);
		this.#audiosURL = value;
	}
	
	get isAudiosLoaded() {
		return this.#isAudiosLoaded;
	}
	
	get isPlayed() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		return this.#isPlayed;
	}
	
	get typeKeys() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		return this.#typeKeys;
	}
	
	get typeKeyboardSounds() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		return this.#typeKeyboardSounds;
	}
	
	get typeKeyboardSoundDefault() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		return this.#typeKeyboardSoundDefault;
	}
	
	set typeKeyboardSoundDefault(value) {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		if (!this.#typeKeyboardSounds.includes(value)) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.TYPEKEYBOARDSOUNDINVALID);
		
		this.#typeKeyboardSoundDefault = value;
	}
	
	get typeKeyPref() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		return this.#typeKeyPref;
	}
	
	set typeKeyPref(value) {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		if (!this.#typeKeys.includes(value)) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.TYPEKEYINVALID);
		
		this.#typeKeyPref = value;
	}
	
	get currentTypeKeyboardSound() {
		if (!this.#isAudiosLoaded) throw new KeyboardSoundError(KeyboardSound.#ERROR_MESSAGE.AUDIOSNOLOADED);
		return this.#currentTypeKeyboardSound;
	}
}

export { KeyboardSound };