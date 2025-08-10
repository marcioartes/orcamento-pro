// js/auth.js

import { auth, provider } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

/**
 * Inicia o fluxo de login com o pop-up do Google.
 */
export function login() {
  signInWithPopup(auth, provider).catch((error) => {
      if (error.code !== 'auth/popup-closed-by-user') {
          console.error("Erro no login:", error);
      }
  });
}

/**
 * Desconecta o usuário atual do Firebase.
 */
export function logout() {
  signOut(auth).catch((error) => console.error("Erro ao deslogar:", error));
}

// Exporta o observador e a instância 'auth' para serem usados no main.js.
export { auth, onAuthStateChanged };