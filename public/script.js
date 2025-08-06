import { auth, provider, signInWithPopup, signOut } from "./auth.js";

let currentBudgetId = null;
let currentClientId = null;

class DataManager {
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("Erro ao salvar dados:", e);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error("Erro ao remover dados:", e);
            return false;
        }
    }
}

// Auth
function login() {
    const user = signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            DataManager.set("session", user);
            showScreen("dashboard-screen");
            loadProfile();
            loadClients();
            loadBudgets();
            updateDashboard();
            document.getElementById("profile-form").addEventListener("submit", saveProfile);
            document.getElementById("client-form").addEventListener("submit", saveClient);
            document.getElementById("budget-form").addEventListener("submit", saveBudget);

            document.getElementById("company-cnpj").addEventListener("input", formatCNPJ);

            document.addEventListener("input", (e) => {
                if (
                    e.target.classList.contains("item-quantity") ||
                    e.target.classList.contains("item-price")
                ) {
                    calculateItemTotal(e.target);
                }
            });
        })
        .catch((error) => {
            console.error("Erro no login:", error);
        });
}

function logout() {
    signOut(auth)
        .then(() => {
            DataManager.remove("session");
            showScreen("login-screen");
        })
        .catch((error) => {
            console.error("Erro ao deslogar:", error);
        });
}

function verifyUserSession() {
    const session = DataManager.get("session");
    if(!session) {
        showScreen("login-screen");
    } else {
        showScreen("dashboard-screen");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    verifyUserSession();
    loadProfile();
    loadClients();
    loadBudgets();
    updateDashboard();

    document.getElementById("profile-form").addEventListener("submit", saveProfile);
    document.getElementById("client-form").addEventListener("submit", saveClient);
    document.getElementById("budget-form").addEventListener("submit", saveBudget);

    document.getElementById("company-cnpj").addEventListener("input", formatCNPJ);

    document.addEventListener("input", (e) => {
        if (
            e.target.classList.contains("item-quantity") ||
            e.target.classList.contains("item-price")
        ) {
            calculateItemTotal(e.target);
        }
    });
});

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");

    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));

    const titles = {
        "dashboard-screen": "APP PRO - Gestão de Orçamentos ",
        "budgets-screen": "Orçamentos",
        "clients-screen": "Clientes",
        "profile-screen": "Meu Perfil",
        "login-screen": "Login",
    };
    document.getElementById("header-title").textContent = titles[screenId];
    console.log({screenId, titulo: document.getElementById("header-title").textContent});

    const navItems = document.querySelectorAll(".nav-item");
    const order = ["dashboard-screen", "budgets-screen", "clients-screen", "profile-screen", "login-screen"];
    const index = order.indexOf(screenId);
    if (index !== -1 && navItems[index]) {
        navItems[index].classList.add("active");
    }
}

function openClientModal(clientId = null) {
    currentClientId = clientId;
    const modal = document.getElementById("client-modal");
    const form = document.getElementById("client-form");
    if (clientId) {
        const clients = DataManager.get("clients") || [];
        const client = clients.find((c) => c.id === clientId);
        if (client) {
            document.getElementById("client-name").value = client.name;
            document.getElementById("client-email").value = client.email;
            document.getElementById("client-phone").value = client.phone;
            document.getElementById("client-address").value = client.address;
            document.querySelector("#client-modal .modal-title").textContent = "Editar Cliente";
        }
    } else {
        form.reset();
        document.querySelector("#client-modal .modal-title").textContent = "Novo Cliente";
    }
    modal.classList.add("active");
}

function openBudgetModal(budgetId = null) {
    currentBudgetId = budgetId;
    const modal = document.getElementById("budget-modal");
    const form = document.getElementById("budget-form");
    loadClientOptions();
    if (budgetId) {
        const budgets = DataManager.get("budgets") || [];
        const budget = budgets.find((b) => b.id === budgetId);
        if (budget) {
            document.getElementById("budget-client").value = budget.clientId;
            document.getElementById("budget-delivery").value = budget.delivery;
            document.getElementById("budget-payment").value = budget.payment;
            document.getElementById("budget-notes").value = budget.notes;
            loadBudgetItems(budget.items);
            document.querySelector("#budget-modal .modal-title").textContent = "Editar Orçamento";
        }
    } else {
        form.reset();
        resetBudgetItems();
        document.querySelector("#budget-modal .modal-title").textContent = "Novo Orçamento";
    }
    modal.classList.add("active");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
    currentClientId = null;
    currentBudgetId = null;
}

// PROFILE
function loadProfile() {
    const profile = DataManager.get("profile") || {};
    document.getElementById("company-name").value = profile.name || "";
    document.getElementById("company-cnpj").value = profile.cnpj || "";
    document.getElementById("company-address").value = profile.address || "";
    document.getElementById("company-phone").value = profile.phone || "";
    document.getElementById("company-email").value = profile.email || "";
}

function saveProfile(e) {
    e.preventDefault();
    const profile = {
        name: document.getElementById("company-name").value.trim(),
        cnpj: document.getElementById("company-cnpj").value.trim(),
        address: document.getElementById("company-address").value.trim(),
        phone: document.getElementById("company-phone").value.trim(),
        email: document.getElementById("company-email").value.trim(),
    };
    DataManager.set("profile", profile);
    alert("Perfil salvo com sucesso!");
}

// CLIENTES
function loadClients() {
    const clients = DataManager.get("clients") || [];
    const list = document.getElementById("clients-list");
    if (clients.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>Nenhum cliente encontrado</p>
            </div>`;
        return;
    }
    list.innerHTML = clients.map((client) => `
        <div class="list-item">
            <div class="list-item-info">
                <h3>${client.name}</h3>
                <p>${client.email || "Email não informado"}</p>
                <p>${client.phone || "Telefone não informado"}</p>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon btn-secondary" onclick="openClientModal('${client.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteClient('${client.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>`).join("");
}

function saveClient(e) {
    e.preventDefault();
    const clients = DataManager.get("clients") || [];
    const name = document.getElementById("client-name").value.trim();
    const email = document.getElementById("client-email").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const address = document.getElementById("client-address").value.trim();

    if (!name) {
        alert("O nome é obrigatório.");
        return;
    }

    const clientData = {
        id: currentClientId || Date.now().toString(),
        name,
        email,
        phone,
        address,
        createdAt: currentClientId ? clients.find(c => c.id === currentClientId)?.createdAt : new Date().toISOString()
    };

    if (currentClientId) {
        const index = clients.findIndex((c) => c.id === currentClientId);
        if (index > -1) clients[index] = clientData;
    } else {
        clients.push(clientData);
    }

    DataManager.set("clients", clients);
    loadClients();
    loadClientOptions();
    updateDashboard();
    closeModal("client-modal");
    alert(currentClientId ? "Cliente atualizado!" : "Cliente salvo!");
}

function deleteClient(id) {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
        const clients = (DataManager.get("clients") || []).filter(c => c.id !== id);
        DataManager.set("clients", clients);
        loadClients();
        loadClientOptions();
        updateDashboard();
    }
}

function loadClientOptions() {
    const clients = DataManager.get("clients") || [];
    const select = document.getElementById("budget-client");
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clients.forEach(client => {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
    });
}

// ORÇAMENTOS
function loadBudgets() {
    const budgets = DataManager.get("budgets") || [];
    const clients = DataManager.get("clients") || [];
    const list = document.getElementById("budgets-list");
    const recent = document.getElementById("recent-budgets");

    if (budgets.length === 0) {
        const empty = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Nenhum orçamento encontrado</p>
            </div>`;
        list.innerHTML = empty;
        recent.innerHTML = empty;
        return;
    }

    const sorted = [...budgets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const itemsHTML = sorted.map(b => {
        const client = clients.find(c => c.id === b.clientId);
        const total = b.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
        return `
            <div class="list-item">
                <div class="list-item-info">
                    <h3>Orçamento #${b.id.slice(-6)}</h3>
                    <p>Cliente: ${client?.name || "Não encontrado"}</p>
                    <p>Total: R$ ${total.toFixed(2).replace(".", ",")}</p>
                    <p>Criado em: ${new Date(b.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon btn-secondary" onclick="openBudgetModal('${b.id}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="btn-icon btn-success" onclick="exportBudgetPDF('${b.id}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteBudget('${b.id}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>`;
    }).join("");

    list.innerHTML = itemsHTML;

    // Recent budgets
    const recentHTML = sorted.slice(0, 3).map(b => {
        const client = clients.find(c => c.id === b.clientId);
        const total = b.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
        return `
            <div class="list-item" onclick="openBudgetModal('${b.id}')">
                <div class="list-item-info">
                    <h3>Orçamento #${b.id.slice(-6)}</h3>
                    <p>Cliente: ${client?.name || "Não encontrado"}</p>
                    <p>Total: R$ ${total.toFixed(2).replace(".", ",")}</p>
                </div>
            </div>`;
    }).join("");

    recent.innerHTML = recentHTML || `
        <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Nenhum orçamento criado ainda</p>
        </div>`;
}

function saveBudget(e) {
    e.preventDefault();
    const budgets = DataManager.get("budgets") || [];
    const items = collectBudgetItems();
    if (items.length === 0) {
        alert("Adicione pelo menos um item ao orçamento!");
        return;
    }

    const data = {
        id: currentBudgetId || Date.now().toString(),
        clientId: document.getElementById("budget-client").value,
        delivery: document.getElementById("budget-delivery").value.trim(),
        payment: document.getElementById("budget-payment").value.trim(),
        notes: document.getElementById("budget-notes").value.trim(),
        items,
        createdAt: currentBudgetId ? budgets.find(b => b.id === currentBudgetId)?.createdAt : new Date().toISOString()
    };

    if (currentBudgetId) {
        const index = budgets.findIndex(b => b.id === currentBudgetId);
        if (index > -1) budgets[index] = data;
    } else {
        budgets.push(data);
    }

    DataManager.set("budgets", budgets);
    loadBudgets();
    updateDashboard();
    closeModal("budget-modal");
    alert(currentBudgetId ? "Orçamento atualizado!" : "Orçamento salvo!");
}

function deleteBudget(id) {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
        const budgets = (DataManager.get("budgets") || []).filter(b => b.id !== id);
        DataManager.set("budgets", budgets);
        loadBudgets();
        updateDashboard();
    }
}

function resetBudgetItems() {
    const container = document.getElementById("budget-items");
    container.innerHTML = `
        <div class="budget-item-form">
            <div class="form-group">
                <label>Descrição do Serviço</label>
                <input type="text" class="item-description" placeholder="Descrição do serviço">
            </div>
            <div class="form-group">
                <label>Quantidade</label>
                <input type="number" class="item-quantity" value="1" min="1">
            </div>
            <div class="form-group">
                <label>Preço Unitário</label>
                <input type="number" class="item-price" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
                <label>Total do Item</label>
                <input type="text" class="item-total" readonly>
            </div>
        </div>`;
    calculateBudgetTotal();
}

function loadBudgetItems(items) {
    const container = document.getElementById("budget-items");
    container.innerHTML = "";
    items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "budget-item-form";
        div.innerHTML = `
            <div class="form-group">
                <label>Descrição do Serviço</label>
                <input type="text" class="item-description" value="${item.description}" placeholder="Descrição do serviço">
            </div>
            <div class="form-group">
                <label>Quantidade</label>
                <input type="number" class="item-quantity" value="${item.quantity}" min="1">
            </div>
            <div class="form-group">
                <label>Preço Unitário</label>
                <input type="number" class="item-price" step="0.01" value="${item.price}">
            </div>
            <div class="form-group">
                <label>Total do Item</label>
                <input type="text" class="item-total" value="R$ ${(item.quantity * item.price).toFixed(2).replace(".", ",")}" readonly>
            </div>
            ${index > 0 ? `<button type="button" class="btn btn-danger" onclick="removeBudgetItem(this)">Remover Item</button>` : ""}`;
        container.appendChild(div);
    });
    calculateBudgetTotal();
}

function addBudgetItem() {
    const container = document.getElementById("budget-items");
    const div = document.createElement("div");
    div.className = "budget-item-form";
    div.innerHTML = `
        <div class="form-group">
            <label>Descrição do Serviço</label>
            <input type="text" class="item-description" placeholder="Descrição do serviço">
        </div>
        <div class="form-group">
            <label>Quantidade</label>
            <input type="number" class="item-quantity" value="1" min="1">
        </div>
        <div class="form-group">
            <label>Preço Unitário</label>
            <input type="number" class="item-price" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Total do Item</label>
            <input type="text" class="item-total" readonly>
        </div>
        <button type="button" class="btn btn-danger" onclick="removeBudgetItem(this)">Remover Item</button>`;
    container.appendChild(div);
    calculateBudgetTotal();
}

function removeBudgetItem(button) {
    button.parentElement.remove();
    calculateBudgetTotal();
}

function calculateItemTotal(input) {
    const itemForm = input.closest(".budget-item-form");
    const quantity = parseFloat(itemForm.querySelector(".item-quantity").value) || 0;
    const price = parseFloat(itemForm.querySelector(".item-price").value) || 0;
    const total = quantity * price;
    itemForm.querySelector(".item-total").value = `R$ ${total.toFixed(2).replace(".", ",")}`;
    calculateBudgetTotal();
}

function calculateBudgetTotal() {
    const forms = document.querySelectorAll(".budget-item-form");
    let total = 0;
    forms.forEach(form => {
        const q = parseFloat(form.querySelector(".item-quantity").value) || 0;
        const p = parseFloat(form.querySelector(".item-price").value) || 0;
        total += q * p;
    });
    document.getElementById("budget-total").value = `R$ ${total.toFixed(2).replace(".", ",")}`;
}

function collectBudgetItems() {
    const forms = document.querySelectorAll(".budget-item-form");
    const items = [];
    forms.forEach(form => {
        const description = form.querySelector(".item-description").value.trim();
        const quantity = parseFloat(form.querySelector(".item-quantity").value) || 0;
        const price = parseFloat(form.querySelector(".item-price").value) || 0;
        if (description && quantity > 0 && price >= 0) {
            items.push({ description, quantity, price });
        }
    });
    return items;
}

function exportBudgetPDF(id) {
    const budgets = DataManager.get("budgets") || [];
    const budget = budgets.find(b => b.id === id);
    if (!budget) {
        alert("Orçamento não encontrado!");
        return;
    }

    const clients = DataManager.get("clients") || [];
    const profile = DataManager.get("profile") || {};
    const client = clients.find(c => c.id === budget.clientId);
    const total = budget.items.reduce((sum, i) => sum + i.quantity * i.price, 0);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Orçamento #${budget.id.slice(-6)}</title>
            <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    <h1>${profile.name || "Empresa"}</h1>
                    <p>CNPJ: ${profile.cnpj || "Não informado"}</p>
                    <p>Endereço: ${profile.address || "Não informado"}</p>
                    <p>Email: ${profile.email || "Não informado"}</p>
                </div>
                <h2 style="margin-top: 30px;">ORÇAMENTO #${budget.id.slice(-6)}</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead><tr style="background: #f5f5f5;"><th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Descrição</th><th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Qtd</th><th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Preço</th><th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th></tr></thead>
                    <tbody>
                        ${budget.items.map(i => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 10px;">${i.description}</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${i.quantity}</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">R$ ${i.price.toFixed(2).replace(".", ",")}</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">R$ ${(i.quantity * i.price).toFixed(2).replace(".", ",")}</td>
                            </tr>`).join("")}
                    </tbody>
                </table>
                <div style="text-align: right; font-size: 18px; font-weight: bold;">
                    TOTAL GERAL: R$ ${total.toFixed(2).replace(".", ",")}
                </div>
                <div style="margin-top: 40px; text-align: center; color: #666;">
                <p>Orçamento gerado em: ${new Date().toLocaleString("pt-BR")}</p>
                <p>Octopus Software & Design. 41.98793-7009</p>
                </div>
            </div>
        </body>
        </html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
}

function updateDashboard() {
    const budgets = DataManager.get("budgets") || [];
    const clients = DataManager.get("clients") || [];
    document.getElementById("total-budgets").textContent = budgets.length;
    document.getElementById("total-clients").textContent = clients.length;
}

function formatCNPJ(e) {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    e.target.value = v;
}

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.classList.remove("active");
        currentClientId = null;
        currentBudgetId = null;
    }
});

window.login = login;
window.logout = logout;
window.showScreen = showScreen;
window.openClientModal = openClientModal;
window.openBudgetModal = openBudgetModal;
window.closeModal = closeModal;
window.addBudgetItem = addBudgetItem;
window.deleteClient = deleteClient;
window.deleteBudget = deleteBudget;
window.exportBudgetPDF = exportBudgetPDF;