// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
// No futuro, para o banco de dados, você adicionará: import { getFirestore } from "...";

// Suas chaves de configuração do Firebase.
const firebaseConfig = {
    apiKey: "AIzaSyCVvf8wKaZO8frn17e8vsoQQvB6ZX6wrCA",
    authDomain: "orcamentopro-5fab8.firebaseapp.com",
    projectId: "orcamentopro-5fab8",
    storageBucket: "orcamentopro-5fab8.appspot.com",
    messagingSenderId: "798859547323",
    appId: "1:798859547323:web:9396a0e5893a0fe7470f9e",
    measurementId: "G-V694NR59H8"
};

// Inicializa a aplicação do Firebase.
const app = initializeApp(firebaseConfig);

// Cria e exporta as instâncias dos serviços do Firebase.
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
// export const db = getFirestore(app); // <- Linha para ser ativada no futuro (Firestore)