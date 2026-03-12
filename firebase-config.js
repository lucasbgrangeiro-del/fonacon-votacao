// Configuração do Firebase
// Substitua as chaves abaixo pelas do seu projeto Firebase no Console.
const firebaseConfig = {
    apiKey: "AIzaSyAluRQGOINapX8-TgyUa17PG5Zl3mynDrM",
    authDomain: "votacao-fonacon.firebaseapp.com",
    databaseURL: "https://votacao-fonacon-default-rtdb.firebaseio.com",
    projectId: "votacao-fonacon",
    storageBucket: "votacao-fonacon.firebasestorage.app",
    messagingSenderId: "486696695846",
    appId: "1:486696695846:web:f2dbe2deaf93c816480ee7"
};

// Inicializar o Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar os serviços necessários (Realtime Database -> passando a URL referenciada para forçar a conexão correta)
const db = firebase.database();
