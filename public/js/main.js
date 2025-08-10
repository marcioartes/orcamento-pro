// js/main.js

// --- 1. Importações dos Módulos ---
import { auth, onAuthStateChanged, login, logout } from './auth.js';
import * as db from './database.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { exportBudgetPDF } from './pdf.js';

// --- 2. Variáveis Globais de Estado ---
let currentBudgetId = null;
let currentClientId = null;

// --- 3. Referências aos Contêineres Principais ---
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('main-app');

// ===================================================================
//  4. PONTO DE ENTRADA PRINCIPAL (O "VIGIA")
// ===================================================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    appContainer.style.display = 'block';
    loginContainer.style.display = 'none';
    carregarDadosIniciais(user.uid);
    adicionarEventListenersApp(user.uid);
  } else {
    appContainer.style.display = 'none';
    loginContainer.style.display = 'block';
  }
});

// ===================================================================
//  5. FUNÇÕES DE INICIALIZAÇÃO E ORQUESTRAÇÃO
// ===================================================================
function carregarDadosIniciais(userId) {
  const profile = db.getProfile();
  const clients = db.getClients();
  const budgets = db.getBudgets();

  ui.renderProfile(profile);
  ui.renderClientList(clients);
  ui.renderBudgetList(budgets, clients);
  ui.renderRecentBudgets(budgets, clients);
  ui.updateDashboard(budgets, clients);
  ui.showScreen('dashboard-screen');
}

function adicionarEventListenersApp(userId) {
    document.getElementById("profile-form").addEventListener("submit", handleSaveProfile);
    document.getElementById("client-form").addEventListener("submit", handleSaveClient);
    document.getElementById("budget-form").addEventListener("submit", handleSaveBudget);

    document.getElementById("company-cnpj").addEventListener("input", (e) => utils.formatCNPJ(e.target));
    const clientDocumentInput = document.getElementById("client-document");
    if(clientDocumentInput) {
        clientDocumentInput.addEventListener("input", (e) => utils.formatCpfCnpj(e.target));
    }

    const logoInput = document.getElementById('company-logo');
    logoInput.addEventListener('change', () => ui.handleLogoPreview(logoInput));

    document.addEventListener("input", (e) => {
      if (e.target.classList.contains("item-quantity") || e.target.classList.contains("item-price")) {
          ui.calculateItemTotal(e.target);
      }
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            const closedId = ui.closeModal(e.target.id);
            if(closedId === 'client-modal') currentClientId = null;
            if(closedId === 'budget-modal') currentBudgetId = null;
        }
    });
}

// ===================================================================
//  6. HANDLERS DE EVENTOS (A "COLA" ENTRE UI E DADOS)
// ===================================================================

function handleSaveProfile(e) {
    e.preventDefault();
    const profileData = ui.getProfileFormData();
    db.saveProfileData(profileData);
    alert("Perfil salvo com sucesso!");
}

function handleSaveClient(e) {
    e.preventDefault();
    const clientData = ui.getClientFormData(currentClientId);
    if (!clientData) return;

    const clients = db.getClients();
    if (currentClientId) {
        const index = clients.findIndex(c => c.id === currentClientId);
        if (index > -1) clients[index] = clientData;
    } else {
        clients.push(clientData);
    }
    db.saveClientsData(clients);

    ui.renderClientList(db.getClients());
    ui.populateClientOptions(db.getClients());
    ui.updateDashboard(db.getBudgets(), db.getClients());
    ui.closeModal('client-modal');

    // CORREÇÃO: Alerta de sucesso adicionado aqui
    alert(currentClientId ? "Cliente atualizado com sucesso!" : "Cliente salvo com sucesso!");

    currentClientId = null;
}

function handleSaveBudget(e) {
    e.preventDefault();
    const items = ui.collectBudgetItems();
    if (items === null) return;
    if (items.length === 0) {
        alert("Adicione pelo menos um item ao orçamento!");
        return;
    }

    const budgetData = ui.getBudgetFormData(currentBudgetId, items);
    if (!budgetData.clientId) {
        alert("Por favor, selecione um cliente.");
        return;
    }

    const budgets = db.getBudgets();
    if (currentBudgetId) {
        const index = budgets.findIndex(b => b.id === currentBudgetId);
        if (index > -1) budgets[index] = budgetData;
    } else {
        budgets.push(budgetData);
    }
    db.saveBudgetsData(budgets);

    const clients = db.getClients();
    ui.renderBudgetList(db.getBudgets(), clients);
    ui.renderRecentBudgets(db.getBudgets(), clients);
    ui.updateDashboard(db.getBudgets(), clients);
    ui.closeModal('budget-modal');

    alert(currentBudgetId ? "Orçamento atualizado com sucesso!" : "Orçamento salvo com sucesso!");

    currentBudgetId = null;
}

function handleDeleteClient(id) {
    if (db.deleteClient(id)) {
        ui.renderClientList(db.getClients());
        ui.populateClientOptions(db.getClients());
        ui.updateDashboard(db.getBudgets(), db.getClients());
    }
}

function handleDeleteBudget(id) {
     if (db.deleteBudget(id)) {
        const clients = db.getClients();
        ui.renderBudgetList(db.getBudgets(), clients);
        ui.renderRecentBudgets(db.getBudgets(), clients);
        ui.updateDashboard(db.getBudgets(), clients);
    }
}

// js/main.js

// ===================================================================
//  EXPOSIÇÃO GLOBAL DE FUNÇÕES PARA O HTML (onclick)
// ===================================================================

// Conecta as ações do HTML (onclick) com as funções do nosso código.
window.login = login;
window.logout = logout;
window.showScreen = ui.showScreen;

// Funções chamadas pelos botões "Novo Cliente" e "Novo Orçamento"
// Elas chamam as funções 'handle' sem passar um ID.
window.openClientModal = () => window.handleOpenClientModal(null);
window.openBudgetModal = () => window.handleOpenBudgetModal(null);

// Funções "Handler" que orquestram a abertura dos modais (para novo ou edição)
window.handleOpenClientModal = (clientId = null) => {
    const clientToEdit = clientId ? db.getClients().find(c => c.id === clientId) : null;
    currentClientId = ui.openClientModal(clientToEdit);
};
window.handleOpenBudgetModal = (budgetId = null) => {
    const budgetToEdit = budgetId ? db.getBudgets().find(b => b.id === budgetId) : null;
    currentBudgetId = ui.openBudgetModal(budgetToEdit, db.getClients());
};

// Funções para fechar modais e manipular itens de orçamento
window.closeModal = (id) => {
    ui.closeModal(id);
    currentClientId = null;
    currentBudgetId = null;
};
window.addBudgetItem = ui.addBudgetItem;
window.removeBudgetItem = ui.removeBudgetItem;

// Funções para deletar e exportar
window.handleDeleteClient = handleDeleteClient;
window.handleDeleteBudget = handleDeleteBudget;
window.exportBudgetPDF = exportBudgetPDF;