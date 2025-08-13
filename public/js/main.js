// js/main.js

import { auth, onAuthStateChanged, login, logout } from './auth.js';
import * as db from './database.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { exportBudgetPDF } from './pdf.js';

let currentBudgetId = null;
let currentClientId = null;

const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('main-app');

onAuthStateChanged(auth, (user) => {
  if (user) {
    appContainer.style.display = 'flex';
    loginContainer.style.display = 'none';
    carregarDadosIniciais(user.uid);
    adicionarEventListenersApp(user.uid);
  } else {
    appContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
  }
});

function carregarDadosIniciais(userId) {
  const profile = db.getProfile();
  const clients = db.getClients();
  const budgets = db.getBudgets();

  ui.renderProfile(profile);
  ui.renderClientList(clients);
  ui.renderBudgetList(budgets, clients);
  ui.renderRecentBudgets(budgets, clients);
  ui.updateDashboard();
  ui.showScreen('dashboard-screen');
}

function adicionarEventListenersApp(userId) {
    // Event listeners para formulários
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
        profileForm.addEventListener("submit", handleSaveProfile);
    }

    const clientForm = document.getElementById("client-form");
    if (clientForm) {
        clientForm.addEventListener("submit", handleSaveClient);
    }

    const budgetForm = document.getElementById("budget-form");
    if (budgetForm) {
        budgetForm.addEventListener("submit", handleSaveBudget);
    }

    // Event listeners para formatação de documentos
    const companyCnpj = document.getElementById("company-cnpj");
    if (companyCnpj) {
        companyCnpj.addEventListener("input", (e) => utils.formatCpfCnpj(e.target));
    }

    const clientDocumentInput = document.getElementById("client-document");
    if (clientDocumentInput) {
        clientDocumentInput.addEventListener("input", (e) => utils.formatCpfCnpj(e.target));
    }

    // Event listener para logo
    const logoInput = document.getElementById('company-logo');
    if (logoInput) {
        logoInput.addEventListener('change', () => ui.handleLogoPreview(logoInput));
    }

    // Event listeners delegados para elementos dinâmicos
    document.addEventListener("input", (e) => {
        if (e.target.classList.contains("item-quantity") || e.target.classList.contains("item-price")) {
            ui.calculateItemTotal(e.target);
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            const closedId = ui.closeModal(e.target.id);
            if (closedId === 'client-modal') currentClientId = null;
            if (closedId === 'budget-modal') currentBudgetId = null;
        }
    });
}

function handleSaveProfile(e) {
    e.preventDefault();
    try {
        const profileData = ui.getProfileFormData();
        db.saveProfileData(profileData);
        alert("Perfil salvo com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        alert("Erro ao salvar perfil. Tente novamente.");
    }
}

function handleSaveClient(e) {
    e.preventDefault();
    try {
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
        ui.updateDashboard();
        ui.closeModal('client-modal');
        alert(currentClientId ? "Cliente atualizado com sucesso!" : "Cliente salvo com sucesso!");
        currentClientId = null;
    } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        alert("Erro ao salvar cliente. Tente novamente.");
    }
}

function handleSaveBudget(e) {
    e.preventDefault();
    try {
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
        ui.updateDashboard();
        ui.closeModal('budget-modal');
        alert(currentBudgetId ? "Orçamento atualizado com sucesso!" : "Orçamento salvo com sucesso!");
        currentBudgetId = null;
    } catch (error) {
        console.error("Erro ao salvar orçamento:", error);
        alert("Erro ao salvar orçamento. Tente novamente.");
    }
}

function handleDeleteClient(id) {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
        if (db.deleteClient(id)) {
            ui.renderClientList(db.getClients());
            ui.populateClientOptions(db.getClients());
            ui.updateDashboard();
        }
    }
}

function handleDeleteBudget(id) {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
        if (db.deleteBudget(id)) {
            const clients = db.getClients();
            ui.renderBudgetList(db.getBudgets(), clients);
            ui.renderRecentBudgets(db.getBudgets(), clients);
            ui.updateDashboard();
        }
    }
}

// ===================================================================
//  EXPOSIÇÃO GLOBAL DE FUNÇÕES PARA O HTML (onclick)
// ===================================================================

window.login = login;
window.logout = logout;
window.showScreen = ui.showScreen;

window.openClientModal = (id = null) => {
    const clientToEdit = id ? db.getClients().find(c => c.id === id) : null;
    currentClientId = ui.openClientModal(clientToEdit);
};

window.openBudgetModal = (id = null) => {
    const budgetToEdit = id ? db.getBudgets().find(b => b.id === id) : null;
    currentBudgetId = ui.openBudgetModal(budgetToEdit, db.getClients());
};

window.handleOpenClientModal = window.openClientModal;
window.handleOpenBudgetModal = window.openBudgetModal;

window.closeModal = (id) => {
    ui.closeModal(id);
    currentClientId = null;
    currentBudgetId = null;
};

window.addBudgetItem = ui.addBudgetItem;
window.removeBudgetItem = ui.removeBudgetItem;
window.handleDeleteClient = handleDeleteClient;
window.handleDeleteBudget = handleDeleteBudget;
window.exportBudgetPDF = exportBudgetPDF;