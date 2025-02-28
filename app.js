// Configuração do Firebase
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

// Inicializar o Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variável para armazenar o saldo atual
let currentBalance = 0;

// Função de logout
function logout() {
    signOut(auth).then(() => {
        window.location.href = "login.html"; // Redireciona para a tela de login
    }).catch((error) => {
        console.error("Erro ao sair:", error);
    });
}

// Função para abrir a janela de solicitação de crédito
function openCreditModal() {
    const creditModal = document.getElementById('creditModal');
    creditModal.style.display = 'flex';

    // Atualizar o valor do slider ao ser alterado
    const creditSlider = document.getElementById('creditSlider');
    const sliderValue = document.getElementById('sliderValue');
    creditSlider.oninput = function() {
        sliderValue.innerText = 'R$ ' + creditSlider.value;
    };
}

// Função para enviar a solicitação de crédito
function submitCreditRequest() {
    const creditSlider = document.getElementById('creditSlider');
    const creditAmount = parseFloat(creditSlider.value);

    if (creditAmount >= 1000) {
        alert('Crédito de R$ ' + creditAmount + ' solicitado com sucesso!');
        closeCreditModal();
    } else {
        alert('Valor mínimo de crédito é R$ 1.000');
    }
}

// Função para fechar o modal
function closeCreditModal() {
    const creditModal = document.getElementById('creditModal');
    creditModal.style.display = 'none';
}

// Monitorando o estado de autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuário está logado
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('usernameDisplay').textContent = userData.username;

            // Carregar o saldo
            document.getElementById('balance').textContent = userData.balance.toFixed(2);

            // Carregar as últimas transações
            const transactionsRef = collection(db, "transactions");
            const q = query(transactionsRef, orderBy("date", "desc"), limit(5));
            const querySnapshot = await getDocs(q);
            let transactionsHTML = '';
            querySnapshot.forEach((doc) => {
                const transaction = doc.data();
                transactionsHTML += `
                    <div class="transaction-item">
                        <p><strong>Data:</strong> ${new Date(transaction.date.seconds * 1000).toLocaleString()}</p>
                        <p><strong>Valor:</strong> R$ ${transaction.amount.toFixed(2)}</p>
                        <p><strong>Descrição:</strong> ${transaction.description}</p>
                    </div>
                `;
            });
            document.getElementById('transactionsList').innerHTML = transactionsHTML;

            // Log para depuração: Verificar o saldo
            console.log("Saldo do usuário:", userData.balance);

            // Habilitar ou desabilitar o botão de transferência com base no saldo
            const transferButton = document.getElementById('transferButton');
            if (userData.balance > 0) {
                transferButton.disabled = false;
            } else {
                transferButton.disabled = true;
            }
        }
    } else {
        // Usuário não está logado
        window.location.href = "login.html"; // Redireciona para o login se o usuário não estiver autenticado
    }
});

// Função para enviar pedidos (simulação)
function sendOrder() {
    const orderUsername = document.getElementById('orderUsername').value;
    const orderAmount = parseInt(document.getElementById('orderAmount').value);

    if (orderUsername && orderAmount && orderAmount > 0) {
        // Simulando o envio de um pedido
        const ordersRef = collection(db, "orders");
        addDoc(ordersRef, {
            user: orderUsername,
            amount: orderAmount,
            date: new Date(),
        }).then(() => {
            alert(`Pedido de ${orderAmount} enviado para o usuário ${orderUsername}`);
        }).catch((error) => {
            console.error("Erro ao enviar pedido:", error);
        });
    } else {
        alert("Por favor, preencha todos os campos corretamente.");
    }
}