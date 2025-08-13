// ===================================================================
//  IMPORTAÇÕES E CONFIGURAÇÃO INICIAL
// ===================================================================
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged } from "./auth.js";

let currentBudgetId = null;
let currentClientId = null;

// --- Referências aos Contêineres Principais do HTML ---
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('main-app');


// ===================================================================
//  O NOVO "CORAÇÃO" DO APLICATIVO - O VIGIA DE AUTENTICAÇÃO
// ===================================================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    // SE O USUÁRIO ESTIVER LOGADO
    console.log("Usuário autenticado:", user.email);
    appContainer.style.display = 'block';
    loginContainer.style.display = 'none';

    carregarDadosIniciais(user.uid);
    adicionarEventListenersApp();

  } else {
    // SE O USUÁRIO NÃO ESTIVER LOGADO
    console.log("Nenhum usuário autenticado.");
    appContainer.style.display = 'none';
    loginContainer.style.display = 'block';
  }
});


// ===================================================================
//  FUNÇÕES DE INICIALIZAÇÃO E EVENTOS
// ===================================================================

function carregarDadosIniciais(userId) {
  console.log("Carregando dados para o usuário:", userId);
  loadProfile();
  loadClients();
  loadBudgets();
  updateDashboard();
  showScreen('dashboard-screen');
}

function adicionarEventListenersApp() {
    document.getElementById("profile-form").addEventListener("submit", saveProfile);
    document.getElementById("client-form").addEventListener("submit", saveClient);
    document.getElementById("budget-form").addEventListener("submit", saveBudget);
    document.getElementById("company-cnpj").addEventListener("input", formatCNPJ);

    const logoInput = document.getElementById('company-logo');
    const logoPreview = document.getElementById('logo-preview');
    if (logoInput && logoPreview) {
        logoInput.addEventListener('change', () => {
            const file = logoInput.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    logoPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    document.addEventListener("input", (e) => {
      if (
          e.target.classList.contains("item-quantity") ||
          e.target.classList.contains("item-price")
      ) {
          calculateItemTotal(e.target);
      }
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            e.target.classList.remove("active");
            currentClientId = null;
            currentBudgetId = null;
        }
    });
}


// ===================================================================
//  FUNÇÕES DE AUTENTICAÇÃO
// ===================================================================

function login() {
  signInWithPopup(auth, provider).catch((error) => console.error("Erro no login:", error));
}

function logout() {
  signOut(auth).catch((error) => console.error("Erro ao deslogar:", error));
}


// ===================================================================
//  A PARTIR DAQUI, SEU CÓDIGO ORIGINAL (LÓGICA DO APP)
// ===================================================================

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

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const screenElement = document.getElementById(screenId);
    if (screenElement) {
        screenElement.classList.add("active");
    }

    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));

    const titles = {
        "dashboard-screen": "APP PRO - Gestão de Orçamentos ",
        "budgets-screen": "Orçamentos",
        "clients-screen": "Clientes",
        "profile-screen": "Meu Perfil",
    };
    document.getElementById("header-title").textContent = titles[screenId] || "Orçamento PRO";

    const navItems = document.querySelectorAll(".nav-item");
    const order = ["dashboard-screen", "budgets-screen", "clients-screen", "profile-screen"];
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

function loadProfile() {
    const profile = DataManager.get("profile") || {};
    const name = document.getElementById("company-name");
    const cnpj = document.getElementById("company-cnpj");
    const address = document.getElementById("company-address");
    const phone = document.getElementById("company-phone");
    const email = document.getElementById("company-email");
    const logoPreview = document.getElementById("logo-preview");

    if (name) name.value = profile.name || "";
    if (cnpj) cnpj.value = profile.cnpj || "";
    if (address) address.value = profile.address || "";
    if (phone) phone.value = profile.phone || "";
    if (email) email.value = profile.email || "";
    if (logoPreview) logoPreview.src = profile.logo || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmMmYyZjIiLz4KPC9zdmc+Cg==";
}

function saveProfile(e) {
    e.preventDefault();
    const profile = {
        name: document.getElementById("company-name").value.trim(),
        cnpj: document.getElementById("company-cnpj").value.trim(),
        address: document.getElementById("company-address").value.trim(),
        phone: document.getElementById("company-phone").value.trim(),
        email: document.getElementById("company-email").value.trim(),
        logo: document.getElementById("logo-preview").src,
    };
    DataManager.set("profile", profile);
    alert("Perfil salvo com sucesso!");
}

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
    if (!name) {
        alert("O nome é obrigatório.");
        return;
    }
    const clientData = {
        id: currentClientId || Date.now().toString(),
        name,
        email: document.getElementById("client-email").value.trim(),
        phone: document.getElementById("client-phone").value.trim(),
        address: document.getElementById("client-address").value.trim(),
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
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clients.forEach(client => {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent = client.name;
        select.appendChild(option);
    });
}

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
        const total = b.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
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

    const recentHTML = sorted.slice(0, 3).map(b => {
        const client = clients.find(c => c.id === b.clientId);
        const total = b.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
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
    if (!container) return;

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
    if (!container) return;
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
            ${index > 0 ? `<button type="button" class="btn btn-danger" onclick="removeBudgetItem(this)">Remover Item</button>` : ""}
        `;
        container.appendChild(div);
    });

    calculateBudgetTotal();
}

// DENTRO DE SCRIPT.JS

function addBudgetItem() {
  const container = document.getElementById("budget-items");
  if (!container) return;

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
    <button type="button" class="btn btn-danger" onclick="removeBudgetItem(this)">Remover Item</button>
  `;
  container.appendChild(div);
  calculateBudgetTotal();
}
function removeBudgetItem(button) {
    button.parentElement.remove();
    calculateBudgetTotal();
}

function calculateItemTotal(input) {
  if (!input) return;
  const itemForm = input.closest(".budget-item-form");
  if (!itemForm) return;

  const quantityInput = itemForm.querySelector(".item-quantity");
  const priceInput = itemForm.querySelector(".item-price");
  const totalInput = itemForm.querySelector(".item-total");

  const quantity = quantityInput ? parseFloat(quantityInput.value) || 0 : 0;
  const price = priceInput ? parseFloat(priceInput.value) || 0 : 0;
  const total = quantity * price;

  if (totalInput) {
    totalInput.value = `R$ ${total.toFixed(2).replace(".", ",")}`;
  }

  calculateBudgetTotal();
}}

function calculateBudgetTotal() {
  const forms = document.querySelectorAll(".budget-item-form");
  let total = 0;

  forms.forEach(form => {
    const quantityInput = form.querySelector(".item-quantity");
    const priceInput = form.querySelector(".item-price");

    const quantity = quantityInput ? parseFloat(quantityInput.value) || 0 : 0;
    const price = priceInput ? parseFloat(priceInput.value) || 0 : 0;

    total += quantity * price;
  });

  const budgetTotalInput = document.getElementById("budget-total");
  if (budgetTotalInput) {
    budgetTotalInput.value = `R$ ${total.toFixed(2).replace(".", ",")}`;
  }
}

function collectBudgetItems() {
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
    const total = budget.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);

    let logoHtml = '';
    if (profile.logo) {
        logoHtml = `<img src="${profile.logo}" alt="Logotipo da Empresa" style="max-height: 80px; max-width: 180px; object-fit: contain;" />`;
    }

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Orçamento #${budget.id.slice(-6)}</title>
        <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; color: #333; }
            p { margin: 5px 0; font-size: 12px; line-height: 1.4; }
            strong { font-weight: bold; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div style="max-width: 800px; margin: 0 auto;">
            <div style="display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                <div style="flex: 0 0 30%; text-align: left;">
                    ${logoHtml}
                </div>
                <div style="flex: 0 0 70%; padding-left: 20px; text-align: left;">
                    <h3 style="margin: 0; font-size: 18px;">${profile.name || "Empresa"}</h3>
                    <p>CNPJ: ${profile.cnpj || "Não informado"}</p>
                    <p>Endereço: ${profile.address || "Não informado"}</p>
                    <p>Email: ${profile.email || "Não informado"}</p>
                    <p>Telefone: ${profile.phone || "Não informado"}</p>
                </div>
            </div>
            <h2 style="margin-top: 30px; font-size: 22px; text-align: center;">ORÇAMENTO #${budget.id.slice(-6)}</h2>
            <div style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
              <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">Dados do Cliente:</h3>
              <p><strong>Cliente:</strong> ${client?.name || "Não informado"}</p>
              <p><strong>Telefone:</strong> ${client?.phone || "Não informado"}</p>
              <p><strong>Endereço:</strong> ${client?.address || "Não informado"}</p>
              <p><strong>Email:</strong> ${client?.email || "Não informado"}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Descrição</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Qtd</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Preço Unit.</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
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
            <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px;">
                TOTAL GERAL: R$ ${total.toFixed(2).replace(".", ",")}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p><strong>Prazo de Entrega:</strong> ${budget.delivery || "A combinar"}</p>
                <p><strong>Forma de Pagamento:</strong> ${budget.payment || "A combinar"}</p>
                ${budget.notes ? `<p style="margin-top: 10px;"><strong>Observações:</strong><br>${budget.notes.replace(/\n/g, '<br>')}</p>` : ''}
            </div>
            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
                <p>Orçamento gerado em: ${new Date().toLocaleString("pt-BR")}</p>
                <p>Octopus Software & Design. 41.98793-7009</p>
            </div>
        </div>
    </body>
    </html>`);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
}

function updateDashboard() {
    const budgets = DataManager.get("budgets") || [];
    const clients = DataManager.get("clients") || [];
    const totalBudgetsEl = document.getElementById("total-budgets");
    const totalClientsEl = document.getElementById("total-clients");

    if (totalBudgetsEl) totalBudgetsEl.textContent = budgets.length;
    if (totalClientsEl) totalClientsEl.textContent = clients.length;
}

function formatCNPJ(e) {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    e.target.value = v;
}

// ===================================================================
//  DISPONIBILIZA FUNÇÕES PARA O HTML (onclick)
// ===================================================================
window.login = login;
window.logout = logout;
window.showScreen = showScreen;
window.openClientModal = openClientModal;
window.openBudgetModal = openBudgetModal;
window.closeModal = closeModal;
window.addBudgetItem = addBudgetItem;
window.removeBudgetItem = removeBudgetItem;
window.deleteClient = deleteClient;
window.deleteBudget = deleteBudget;
window.exportBudgetPDF = exportBudgetPDF;