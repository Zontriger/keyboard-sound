/**
 * @license
 * Copyright (c) 2025 Ricardo Manuel Pacheco Campos alias Zontriger
 * SPDX-License-Identifier: MIT
 *
 * Github: https://github.com/Zontriger/keyboard-sound
*/

"use strict";

(() => {
	async function initApp() {
		const KeyboardSoundModule = await import("./script/KeyboardSound.js");
		const KeyboardSound = KeyboardSoundModule.KeyboardSound;
		
		const container = document.querySelector("#container");
		const keyboardSoundContainer = container.querySelector(".keyboard-sound");
		
		// Mostrar loading spin hasta que carguen los audios
		keyboardSoundContainer.innerHTML = `<div class="loading-container"><div class="loading-spin"></div></div>`; 
		
		const keyboardSound = new KeyboardSound(document);
		
		// Renderizar UI en función de si cargan los audios o no
		try {
			await keyboardSound.loadAudios();
			audiosLoaded();
		} catch (e) {
			audiosNotLoaded();
			console.error(e.message);
		}
		
		function audiosLoaded() {
			keyboardSoundContainer.innerHTML = "";
			
			function renderTypeKeyboardSoundsRadios() {
				const templateRadio = document.querySelector("#type-keyboard-sound-radio-template").content;
				const typeKeyboardSoundRadios = template.querySelector(".type-keyboard-sound-radios");
				
				keyboardSound.typeKeyboardSounds.forEach(typeKeyboardSound => {
					const radio = templateRadio.cloneNode(true);
					const typeKeyboardSoundCapitalize = typeKeyboardSound[0].toUpperCase() + typeKeyboardSound.slice(1);
					
					const input = radio.querySelector("label > input[name='type-keyboard-sound']");
					const span = radio.querySelector("label > span");
					
					input.value = typeKeyboardSound;
					span.textContent = typeKeyboardSoundCapitalize;
					
					if (typeKeyboardSound === keyboardSound.typeKeyboardSoundDefault) input.checked = true;
					
					input.addEventListener("input", () => {
						if (!input.checked) return;
						keyboardSound.changeSound(input.value);
						textarea.focus();
						
					});
					
					typeKeyboardSoundRadios.append(radio);
				});
			}
			
			function enableClearBtn() {
				const clearBtn = template.querySelector(".keys-input > button");
				
				textarea.addEventListener("input", () => {
					if (!textarea.value) {
						clearBtn.style.visibility = "hidden";
						return;
					}
					clearBtn.style.visibility = "visible";
				});
				
				clearBtn.addEventListener("click", () => {
					clearBtn.style.visibility = "hidden";
					textarea.value = "";
					textarea.focus();
				});
			}

			const template = document.querySelector("#audios-loaded-template").content.cloneNode(true);
			const textarea = template.querySelector(".keys-input > textarea");

			renderTypeKeyboardSoundsRadios();
			enableClearBtn();
			
			keyboardSoundContainer.append(template);
			keyboardSound.play();
		}
		
		function audiosNotLoaded() {
			keyboardSoundContainer.innerHTML = "";
			const template = document.querySelector("#audios-not-loaded-template").content.cloneNode(true);
			
			const btnReload = template.querySelector(".reload");
			btnReload.addEventListener("click", () => location.reload());
			
			keyboardSoundContainer.append(template);
		}
	}
	
	initApp();
})();