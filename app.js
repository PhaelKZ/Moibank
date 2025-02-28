import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";

import { 
    getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { 
    getFirestore, doc, getDoc, updateDoc, arrayUnion 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// 🔥 Inicializando Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 👤 Autenticação e carregamento de dados do usuário
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.getElementById('usernameDisplay').textContent = userData.username;
                document.getElementById('balance').textContent = userData.balance.toFixed(2);

                loadOrders(user.uid); // 🔄 Carregar pedidos do usuário
            } else {
                console.error("Usuário não encontrado no Firestore.");
                alert("Erro ao carregar dados do usuário.");
            }
        } catch (error) {
            console.error("Erro ao obter dados do usuário:", error);
        }
    } else {
        window.location.href = "login.html"; // Redireciona para login se não autenticado
    }
});

// 📌 Função para salvar pedidos dentro do documento do usuário
async function saveOrder(userId, amount, description) {
    try {
        const userDocRef = doc(db, "users", userId);

        await updateDoc(userDocRef, {
            orders: arrayUnion({
                amount: amount,
                date: new Date(),
                description: description
            })
        });

        console.log("Pedido salvo com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar pedido:", error);
    }
}

// 📌 Função para carregar pedidos do usuário logado
async function loadOrders(userId) {
    try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            console.log("Usuário não encontrado.");
            document.getElementById("ordersList").innerHTML = "<p>Nenhum pedido encontrado.</p>";
            return;
        }

        const userData = userDoc.data();
        let ordersHTML = "";

        if (!userData.orders || userData.orders.length === 0) {
            ordersHTML = "<p>Nenhum pedido encontrado.</p>";
        } else {
            userData.orders.forEach((order) => {
                let orderDate = order.date ? new Date(order.date.seconds * 1000).toLocaleString() : "Data não disponível";

                ordersHTML += `
                    <div class="order-item">
                        <p><strong>Descrição:</strong> ${order.description || "Sem descrição"}</p>
                        <p><strong>Quantidade:</strong> ${order.amount || "N/A"}</p>
                        <p><strong>Data:</strong> ${orderDate}</p>
                    </div>
                `;
            });
        }

        document.getElementById("ordersList").innerHTML = ordersHTML;
    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        document.getElementById("ordersList").innerHTML = "<p>Erro ao carregar pedidos.</p>";
    }
}

// 📌 Função de logout
function logout() {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Erro ao sair:", error);
    });
}

// Exemplo de uso para testar salvamento de pedidos
// saveOrder("userId_123", 50, "Compra de teste");