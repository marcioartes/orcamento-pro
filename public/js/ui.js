// js/ui.js

// Importa as funções de dados necessárias. A UI não deve acessar o DataManager diretamente.
import { getClients, getBudgets } from './database.js';
// Importa a função de formatação de CPF/CNPJ.
import { formatCpfCnpj } from './utils.js';

// ======================================================
// Funções de Controle de UI (Telas e Modais)
// ======================================================

export function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const screenElement = document.getElementById(screenId);
    if (screenElement) screenElement.classList.add("active");

    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
    const activeNavItem = document.querySelector(`.nav-item[onclick*="'${screenId}'"]`);
    if (activeNavItem) activeNavItem.classList.add("active");

    const titles = {
        "dashboard-screen": "Dashboard",
        "budgets-screen": "Orçamentos",
        "clients-screen": "Clientes",
        "profile-screen": "Meu Perfil",
    };
    document.getElementById("header-title").textContent = titles[screenId] || "Orçamento PRO";
}

export function openClientModal(client = null) {
    const modal = document.getElementById("client-modal");
    const form = document.getElementById("client-form");
    form.reset();

    if (client) {
        document.querySelector("#client-modal .modal-title").textContent = "Editar Cliente";
        document.getElementById("client-name").value = client.name;
        document.getElementById("client-email").value = client.email || "";
        document.getElementById("client-phone").value = client.phone || "";
        document.getElementById("client-address").value = client.address || "";
        const clientDocumentInput = document.getElementById("client-document");
        clientDocumentInput.value = client.documento || "";
        formatCpfCnpj(clientDocumentInput);
    } else {
        document.querySelector("#client-modal .modal-title").textContent = "Novo Cliente";
    }
    modal.classList.add("active");
    return client ? client.id : null;
}

export function openBudgetModal(budget = null, clients = []) {
    const modal = document.getElementById("budget-modal");
    const form = document.getElementById("budget-form");
    form.reset();

    populateClientOptions(clients);

    if (budget) {
        document.querySelector("#budget-modal .modal-title").textContent = "Editar Orçamento";
        document.getElementById("budget-client").value = budget.clientId;
        document.getElementById("budget-delivery").value = budget.delivery || "";
        document.getElementById("budget-payment").value = budget.payment || "";
        document.getElementById("budget-notes").value = budget.notes || "";
        renderBudgetItems(budget.items);
    } else {
        document.querySelector("#budget-modal .modal-title").textContent = "Novo Orçamento";
        renderBudgetItems();
    }
    modal.classList.add("active");
    return budget ? budget.id : null;
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
    return modalId;
}

export function updateDashboard() {
    const budgets = getBudgets();
    const clients = getClients();
    document.getElementById("total-budgets").textContent = budgets.length;
    document.getElementById("total-clients").textContent = clients.length;
}

// ======================================================
// Funções de Renderização (Desenhar Listas e Forms na Tela)
// ======================================================

export function renderProfile(profile) {
    document.getElementById("company-name").value = profile.name || "";
    document.getElementById("company-cnpj").value = profile.cnpj || "";
    document.getElementById("company-address").value = profile.address || "";
    document.getElementById("company-phone").value = profile.phone || "";
    document.getElementById("company-email").value = profile.email || "";
    document.getElementById("logo-preview").src = profile.logo || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmMmYyZjIiLz4KPC9zdmc+Cg==";
}

export function renderClientList(clients) {
    const list = document.getElementById("clients-list");
    if (!clients || clients.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>Nenhum cliente encontrado</p></div>`;
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
                <button class="btn-icon btn-secondary" onclick="window.handleOpenClientModal('${client.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button class="btn-icon btn-danger" onclick="window.handleDeleteClient('${client.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>`).join("");
}

export function renderBudgetList(budgets, clients) {
    const list = document.getElementById("budgets-list");
    if (!budgets || budgets.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>Nenhum orçamento encontrado</p></div>`;
        return;
    }
    const sorted = [...budgets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    list.innerHTML = sorted.map(b => {
        const client = clients.find(c => c.id === b.clientId);
        const total = b.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
        return `
        <div class="list-item">
            <div class="list-item-info" onclick="window.handleOpenBudgetModal('${b.id}')">
                <h3>Orçamento #${b.id.slice(-6)}</h3>
                <p>Cliente: ${client?.name || "Não encontrado"}</p>
                <p>Total: R$ ${total.toFixed(2).replace(".", ",")}</p>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon btn-secondary" onclick="window.handleOpenBudgetModal('${b.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button class="btn-icon btn-success" onclick="window.exportBudgetPDF('${b.id}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </button>
                <button class="btn-icon btn-danger" onclick="window.handleDeleteBudget('${b.id}')">
                     <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>`;
    }).join("");
}

export function renderRecentBudgets(budgets, clients) {
    const recent = document.getElementById("recent-budgets");
    if (!budgets || budgets.length === 0) {
        recent.innerHTML = `<div class="empty-state"><p>Nenhum orçamento criado ainda</p></div>`;
        return;
    }
    const sorted = [...budgets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recent.innerHTML = sorted.slice(0, 3).map(b => {
        const client = clients.find(c => c.id === b.clientId);
        const total = b.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
        return `
        <div class="list-item" onclick="window.handleOpenBudgetModal('${b.id}')">
            <div class="list-item-info">
                <h3>Orçamento #${b.id.slice(-6)}</h3>
                <p>Cliente: ${client?.name || "Não encontrado"}</p>
                <p>Total: R$ ${total.toFixed(2).replace(".", ",")}</p>
            </div>
        </div>`;
    }).join("");
}

export function populateClientOptions(clients) {
    const select = document.getElementById("budget-client");
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clients.forEach(client => {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
    });
}

export function renderBudgetItems(items = []) {
    const container = document.getElementById("budget-items");
    container.innerHTML = "";
    if (items.length === 0) {
        addBudgetItem();
    } else {
        items.forEach(item => addBudgetItem(item));
    }
}

export function addBudgetItem(item = null) {
    const container = document.getElementById("budget-items");
    const div = document.createElement("div");
    div.className = "budget-item-form";
    div.innerHTML = `
        <div class="form-group">
            <label>Descrição</label>
            <input type="text" class="item-description" placeholder="Descrição do serviço" value="${item?.description || ''}">
        </div>
        <div class="form-group">
            <label>Qtd</label>
            <input type="number" class="item-quantity" value="${item?.quantity || 1}" min="1">
        </div>
        <div class="form-group">
            <label>Preço Unit.</label>
            <input type="number" class="item-price" step="0.01" placeholder="0.00" value="${item?.price || ''}">
        </div>
        <div class="form-group">
            <label>Total</label>
            <input type="text" class="item-total" readonly>
        </div>
        <button type="button" class="btn-icon btn-danger" style="margin-left: auto; display: block;" onclick="removeBudgetItem(this)">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    `;
    container.appendChild(div);
    calculateItemTotal(div.querySelector('.item-quantity'));
}

export function removeBudgetItem(button) {
    button.closest(".budget-item-form").remove();
    calculateBudgetTotal();
}

export function handleLogoPreview(logoInput) {
    const logoPreview = document.getElementById('logo-preview');
    const file = logoInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// ======================================================
// Funções de Leitura de Formulários (Getters de UI)
// ======================================================

export function getProfileFormData() {
    return {
        name: document.getElementById("company-name").value.trim(),
        cnpj: document.getElementById("company-cnpj").value.trim(),
        address: document.getElementById("company-address").value.trim(),
        phone: document.getElementById("company-phone").value.trim(),
        email: document.getElementById("company-email").value.trim(),
        logo: document.getElementById("logo-preview").src,
    };
}

export function getClientFormData(currentClientId) {
    const name = document.getElementById("client-name").value.trim();
    if (!name) {
        alert("O campo 'Nome' é obrigatório.");
        return null;
    }
    return {
        id: currentClientId || Date.now().toString(),
        name,
        email: document.getElementById("client-email").value.trim(),
        phone: document.getElementById("client-phone").value.trim(),
        address: document.getElementById("client-address").value.trim(),
        documento: document.getElementById("client-document").value.replace(/\D/g, ''),
        createdAt: new Date().toISOString()
    };
}

export function getBudgetFormData(currentBudgetId, items) {
     return {
        id: currentBudgetId || Date.now().toString(),
        clientId: document.getElementById("budget-client").value,
        delivery: document.getElementById("budget-delivery").value.trim(),
        payment: document.getElementById("budget-payment").value.trim(),
        notes: document.getElementById("budget-notes").value.trim(),
        items: items,
        createdAt: new Date().toISOString()
    };
}

// ======================================================
// Funções de Cálculo (que interagem com a UI)
// ======================================================

export function calculateItemTotal(input) {
    const itemForm = input.closest(".budget-item-form");
    if (!itemForm) return;
    const quantity = parseFloat(itemForm.querySelector(".item-quantity")?.value) || 0;
    const price = parseFloat(itemForm.querySelector(".item-price")?.value) || 0;
    const total = quantity * price;
    const totalInput = itemForm.querySelector(".item-total");
    if(totalInput) totalInput.value = `R$ ${total.toFixed(2).replace(".", ",")}`;
    calculateBudgetTotal();
}

export function calculateBudgetTotal() {
    const forms = document.querySelectorAll(".budget-item-form");
    let total = 0;
    forms.forEach(form => {
        const q = parseFloat(form.querySelector(".item-quantity")?.value) || 0;
        const p = parseFloat(form.querySelector(".item-price")?.value) || 0;
        total += q * p;
    });
    const budgetTotalInput = document.getElementById("budget-total");
    if(budgetTotalInput) budgetTotalInput.value = `R$ ${total.toFixed(2).replace(".", ",")}`;
}

export function collectBudgetItems() {
    const forms = document.querySelectorAll(".budget-item-form");
    const items = [];
    forms.forEach(form => {
        const description = form.querySelector(".item-description")?.value.trim();
        const quantity = parseFloat(form.querySelector(".item-quantity")?.value) || 0;
        const price = parseFloat(form.querySelector(".item-price")?.value) || 0;
        if (description && quantity > 0) {
            items.push({ description, quantity, price });
        }
    });
    if (items.length === 0 && document.querySelector(".item-description")?.value.trim()) {
        alert("Preencha a quantidade e o preço do item antes de salvar.");
        return null;
    }
    return items;
}