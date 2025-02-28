import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, addDoc, query, where, getDocs, collection, arrayUnion } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 🔥 Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBDTYSkgWXK7aXU4afEcJvzVxlJSSvIY14",
    authDomain: "moibank-e522d.firebaseapp.com",
    databaseURL: "https://moibank-e522d-default-rtdb.firebaseio.com",
    projectId: "moibank-e522d",
    storageBucket: "moibank-e522d.firebasestorage.app",
    messagingSenderId: "328089861792",
    appId: "1:328089861792:web:8b94a352c51ee7c51793c5",
    measurementId: "G-8HSMSMEMJW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("transferButton").addEventListener("click", initiateTransfer);
document.getElementById("sendOrderButton").addEventListener("click", sendOrder); // Novo botão para enviar pedidos

// 📌 Função para iniciar a transferência
async function initiateTransfer() {
    const transferUsername = document.getElementById('transferUsername').value.trim();
    const transferAmount = parseFloat(document.getElementById('transferAmount').value);
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = ""; // Limpa mensagens anteriores

    if (!transferUsername || isNaN(transferAmount) || transferAmount <= 0) {
        errorMessage.textContent = "⚠️ Insira um usuário válido e um valor maior que zero.";
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        errorMessage.textContent = "⚠️ Você precisa estar logado para transferir.";
        return;
    }

    try {
        // 📌 Buscar dados do usuário logado
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            errorMessage.textContent = "⚠️ Erro ao recuperar seus dados.";
            return;
        }

        const userData = userDoc.data();
        if (userData.balance < transferAmount) {
            errorMessage.textContent = "⚠️ Saldo insuficiente.";
            return;
        }

        // 📌 Verificar se o destinatário existe
        const recipientQuery = query(collection(db, "users"), where("username", "==", transferUsername));
        const recipientSnapshot = await getDocs(recipientQuery);

        if (recipientSnapshot.empty) {
            errorMessage.textContent = "⚠️ Usuário destinatário não encontrado.";
            return;
        }

        const recipientDoc = recipientSnapshot.docs[0];
        const recipientRef = doc(db, "users", recipientDoc.id);
        const recipientData = recipientDoc.data();

        // 📌 Atualizar saldos (transferência segura)
        await updateDoc(userDocRef, { balance: userData.balance - transferAmount });
        await updateDoc(recipientRef, { balance: recipientData.balance + transferAmount });

        // 📌 Registrar transação no Firestore
        await addDoc(collection(db, "transactions"), {
            from: user.uid,
            to: recipientDoc.id,
            amount: transferAmount,
            description: `Transferência para ${transferUsername}`,
            date: new Date(),
        });

        alert(`✅ Transferência de M̶ ${transferAmount.toFixed(2)} realizada com sucesso para ${transferUsername}.`);
        window.location.href = "dashboard.html"; // Redireciona para o dashboard

    } catch (error) {
        console.error("Erro na transferência:", error);
        errorMessage.textContent = "⚠️ Erro ao processar a transferência.";
    }
}

// 📌 Função para enviar pedidos sem precisar de saldo
async function sendOrder() {
    const orderUsername = document.getElementById('orderUsername').value.trim();
    const orderAmount = parseInt(document.getElementById('orderAmount').value);
    const orderDescription = document.getElementById('orderDescription').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = ""; // Limpa mensagens anteriores

    if (!orderUsername || isNaN(orderAmount) || orderAmount <= 0 || !orderDescription) {
        errorMessage.textContent = "⚠️ Insira um usuário válido, uma quantia e uma descrição.";
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        errorMessage.textContent = "⚠️ Você precisa estar logado para enviar um pedido.";
        return;
    }

    try {
        // 📌 Verificar se o destinatário existe
        const recipientQuery = query(collection(db, "users"), where("username", "==", orderUsername));
        const recipientSnapshot = await getDocs(recipientQuery);

        if (recipientSnapshot.empty) {
            errorMessage.textContent = "⚠️ Usuário destinatário não encontrado.";
            return;
        }

        const recipientDoc = recipientSnapshot.docs[0];
        const recipientRef = doc(db, "users", recipientDoc.id);

        // 📌 Adicionar pedido ao destinatário de forma segura (não cria um loop infinito)
        await updateDoc(recipientRef, {
            orders: arrayUnion({
                amount: orderAmount,
                description: orderDescription,
                from: user.uid,
                date: new Date(),
            })
        });

        alert(`✅ Você enviou ${orderAmount} pedidos para ${orderUsername} com sucesso.`);
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Erro ao enviar pedido:", error);
        errorMessage.textContent = "⚠️ Erro ao processar o pedido.";
    }
}