// services/firebaseFunctions.js
const admin = require("firebase-admin");

// Inicializa Firebase Admin si no está inicializado
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Crea un usuario en Firebase Authentication y guarda información adicional en Firestore.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @param {object} additionalData - Otros datos adicionales a guardar en Firestore.
 */
const createUser = async (email, password, additionalData) => {
    try {
        // Crea el usuario en Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });

        // Almacena datos adicionales en Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email: email,
            isProfileComplete: false,  // Campo que indica si el perfil está completo
            ...additionalData,  // Otros datos adicionales que quieras guardar
        });

        console.log(`Usuario creado con UID: ${userRecord.uid}`);
    } catch (error) {
        console.error('Error creando usuario:', error);
    }
};

module.exports = { createUser };
