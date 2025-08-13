// js/main.js

import { auth, onAuthStateChanged, login, logout } from './auth.js';
import * as db from './database.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import { exportBudgetPDF } from './pdf.js';

let currentBudgetId = null;
let currentClientId = null;

// Aguarda o DOM carregar antes de executar qualquer coisa
document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('main-app');

  if (!loginContainer || !appContainer) {
    console.error("Erro crítico: elementos #login-container ou #main-app não encontrados no DOM.");
    return;
  }

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

  const cnpjInput = document.getElementById("company-cnpj");
  if (cnpjInput) {
    cnpjInput.addEventListener("input", (e) => utils.formatCpfCnpj(e.target));
  }

  const clientDocumentInput = document.getElementById("client-document");
  if (clientDocumentInput) {
    clientDocumentInput.addEventListener("input", (e) => utils.formatCpfCnpj(e.target));
  }

  const logoInput = document.getElementById('company-logo');
  if (logoInput) {
    logoInput.addEventListener('change', () => ui.handleLogoPreview(logoInput));
  }

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
  ui.updateDashboard();
  ui.closeModal('client-modal');
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
  ui.updateDashboard();
  ui.closeModal('budget-modal');
  alert(currentBudgetId ? "Orçamento atualizado com sucesso!" : "Orçamento salvo com sucesso!");
  currentBudgetId = null;
}

function handleDeleteClient(id) {
  if (db.deleteClient(id)) {
    ui.renderClientList(db.getClients());
    ui.populateClientOptions(db.getClients());
    ui.updateDashboard();
  }
}

function handleDeleteBudget(id) {
  if (db.deleteBudget(id)) {
    const clients = db.getClients();
    ui.renderBudgetList(db.getBudgets(), clients);
    ui.renderRecentBudgets(db.getBudgets(), clients);
    ui.updateDashboard();
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