// js/ui.js

import { getClients, getBudgets } from './database.js';
import { formatCpfCnpj } from './utils.js';

// --- Funções de Controle de UI (Telas e Modais) ---
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
    const headerTitle = document.getElementById("header-title");
    if (headerTitle) {
        headerTitle.textContent = titles[screenId] || "Orçamento PRO";
    }
}

export function openClientModal(client = null) {
    const modal = document.getElementById("client-modal");
    const form = document.getElementById("client-form");
    if (!modal || !form) {
        console.error("Modal ou formulário de cliente não encontrado");
        return null;
    }

    form.reset();

    if (client) {
        const modalTitle = document.querySelector("#client-modal .modal-title");
        if (modalTitle) modalTitle.textContent = "Editar Cliente";

        const fields = {
            "client-name": client.name,
            "client-email": client.email || "",
            "client-phone": client.phone || "",
            "client-address": client.address || "",
            "client-document": client.documento || ""
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
                if (fieldId === "client-document") {
                    formatCpfCnpj(field);
                }
            }
        }
    } else {
        const modalTitle = document.querySelector("#client-modal .modal-title");
        if (modalTitle) modalTitle.textContent = "Novo Cliente";
    }

    modal.classList.add("active");
    return client ? client.id : null;
}

export function openBudgetModal(budget = null, clients = []) {
    const modal = document.getElementById("budget-modal");
    const form = document.getElementById("budget-form");
    if (!modal || !form) {
        console.error("Modal ou formulário de orçamento não encontrado");
        return null;
    }

    form.reset();
    populateClientOptions(clients);

    if (budget) {
        const modalTitle = document.querySelector("#budget-modal .modal-title");
        if (modalTitle) modalTitle.textContent = "Editar Orçamento";

        const fields = {
            "budget-client": budget.clientId,
            "budget-delivery": budget.delivery || "",
            "budget-payment": budget.payment || "",
            "budget-notes": budget.notes || ""
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const field = document.getElementById(fieldId);
            if (field) field.value = value;
        }

        renderBudgetItems(budget.items);
    } else {
        const modalTitle = document.querySelector("#budget-modal .modal-title");
        if (modalTitle) modalTitle.textContent = "Novo Orçamento";
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

    const totalBudgetsEl = document.getElementById("total-budgets");
    const totalClientsEl = document.getElementById("total-clients");

    if (totalBudgetsEl) totalBudgetsEl.textContent = budgets.length;
    if (totalClientsEl) totalClientsEl.textContent = clients.length;
}

// --- Funções de Renderização (Desenhar Listas e Forms na Tela) ---

export function renderProfile(profile) {
    const fields = {
        "company-name": profile.name || "",
        "company-cnpj": profile.cnpj || "",
        "company-address": profile.address || "",
        "company-phone": profile.phone || "",
        "company-email": profile.email || ""
    };

    for (const [fieldId, value] of Object.entries(fields)) {
        const field = document.getElementById(fieldId);
        if (field) field.value = value;
    }

    const logoPreview = document.getElementById("logo-preview");
    if (logoPreview) {
        logoPreview.src = profile.logo || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmMmYyZjIiLz4KPC9zdmc+Cg==";
    }
}

export function renderClientList(clients) {
    const list = document.getElementById("clients-list");
    if (!list) return;

    if (!clients || clients.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>Nenhum cliente encontrado</p></div>`;
        return;
    }

    list.innerHTML = clients.map((client) => `
        <div class="list-item">
            <div class="list-item-info" onclick="window.handleOpenClientModal('${client.id}')">
                <h3>${client.name}</h3>
                <p>${client.email || "Email não informado"}</p>
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
    if (!list) return;

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
    if (!recent) return;

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
    if (!container) {
        console.error("Container de itens do orçamento não encontrado");
        return;
    }

    container.innerHTML = "";
    if (items.length === 0) {
        addBudgetItem();
    } else {
        items.forEach(item => addBudgetItem(item));
    }
}

export function addBudgetItem(item = null) {
    const container = document.getElementById("budget-items");
    if (!container) {
        console.error("Container de itens do orçamento não encontrado");
        return;
    }

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
        <button type="button" class="btn-icon btn-danger" style="margin-left: auto; display: block;" onclick="window.removeBudgetItem(this)">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    `;
    container.appendChild(div);

    // Calcular o total inicial do item
    const quantityInput = div.querySelector('.item-quantity');
    if (quantityInput) {
        calculateItemTotal(quantityInput);
    }
}

export function removeBudgetItem(button) {
    const itemForm = button.closest(".budget-item-form");
    if (itemForm) {
        itemForm.remove();
        calculateBudgetTotal();
    }
}

export function handleLogoPreview(logoInput) {
    const logoPreview = document.getElementById('logo-preview');
    if (!logoPreview) return;

    const file = logoInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// --- Funções de Leitura de Formulários (Getters de UI) ---
export function getProfileFormData() {
    const fields = ["company-name", "company-cnpj", "company-address", "company-phone", "company-email"];
    const data = {};

    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        data[fieldId.replace("company-", "")] = element ? element.value.trim() : "";
    });

    const logoPreview = document.getElementById("logo-preview");
    data.logo = logoPreview ? logoPreview.src : "";

    return data;
}

export function getClientFormData(currentClientId) {
    const nameElement = document.getElementById("client-name");
    if (!nameElement) {
        alert("Elemento de nome do cliente não encontrado.");
        return null;
    }

    const name = nameElement.value.trim();
    if (!name) {
        alert("O campo 'Nome' é obrigatório.");
        return null;
    }

    const fields = {
        email: document.getElementById("client-email"),
        phone: document.getElementById("client-phone"),
        address: document.getElementById("client-address"),
        documento: document.getElementById("client-document")
    };

    const data = {
        id: currentClientId || Date.now().toString(),
        name: name,
        createdAt: new Date().toISOString()
    };

    Object.entries(fields).forEach(([key, element]) => {
        if (element) {
            data[key] = key === 'documento' ? element.value.replace(/\D/g, '') : element.value.trim();
        } else {
            data[key] = "";
        }
    });

    return data;
}

export function getBudgetFormData(currentBudgetId, items) {
    const fields = {
        clientId: document.getElementById("budget-client"),
        delivery: document.getElementById("budget-delivery"),
        payment: document.getElementById("budget-payment"),
        notes: document.getElementById("budget-notes")
    };

    const data = {
        id: currentBudgetId || Date.now().toString(),
        items: items,
        createdAt: new Date().toISOString()
    };

    Object.entries(fields).forEach(([key, element]) => {
        if (element) {
            data[key] = element.value.trim();
        } else {
            data[key] = "";
        }
    });

    return data;
}

export function collectBudgetItems() {
    const forms = document.querySelectorAll(".budget-item-form");
    const items = [];
    let hasIncompleteItem = false;

    forms.forEach(form => {
        const descriptionEl = form.querySelector(".item-description");
        const quantityEl = form.querySelector(".item-quantity");
        const priceEl = form.querySelector(".item-price");

        if (!descriptionEl || !quantityEl || !priceEl) {
            console.error("Elementos do item não encontrados");
            return;
        }

        const description = descriptionEl.value.trim();
        const quantity = parseFloat(quantityEl.value) || 0;
        const price = parseFloat(priceEl.value) || 0;

        if (description && quantity > 0 && price >= 0) {
            items.push({ description, quantity, price });
        } else if (description && (quantity <= 0 || isNaN(price))) {
            hasIncompleteItem = true;
        }
    });

    if (hasIncompleteItem) {
        alert("Preencha a quantidade e o preço de todos os itens antes de salvar.");
        return null;
    }

    return items;
}

// --- Funções de Cálculo (que interagem com a UI) ---
export function calculateItemTotal(input) {
    const itemForm = input.closest(".budget-item-form");
    if (!itemForm) return;

    const quantityEl = itemForm.querySelector(".item-quantity");
    const priceEl = itemForm.querySelector(".item-price");
    const totalEl = itemForm.querySelector(".item-total");

    if (!quantityEl || !priceEl || !totalEl) return;

    const quantity = parseFloat(quantityEl.value) || 0;
    const price = parseFloat(priceEl.value) || 0;
    const total = quantity * price;

    totalEl.value = `R$ ${total.toFixed(2).replace(".", ",")}`;
    calculateBudgetTotal();
}

export function calculateBudgetTotal() {
    const forms = document.querySelectorAll(".budget-item-form");
    let total = 0;

    forms.forEach(form => {
        const quantityEl = form.querySelector(".item-quantity");
        const priceEl = form.querySelector(".item-price");

        if (quantityEl && priceEl) {
            const q = parseFloat(quantityEl.value) || 0;
            const p = parseFloat(priceEl.value) || 0;
            total += q * p;
        }
    });

    const budgetTotalInput = document.getElementById("budget-total");
    if (budgetTotalInput) {
        budgetTotalInput.value = `R$ ${total.toFixed(2).replace(".", ",")}`;
    }
}