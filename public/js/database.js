// js/database.js

/**
 * Classe que abstrai a interação com o localStorage.
 * No futuro, a lógica do Firestore será implementada aqui dentro.
 */
class DataManager {
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Erro ao carregar dados da chave '${key}':`, e);
            return null;
        }
    }
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Erro ao salvar dados da chave '${key}':`, e);
        }
    }
}

// === Funções de Leitura (Read) ===
export function getProfile() {
    return DataManager.get("profile") || {};
}
export function getClients() {
    return DataManager.get("clients") || [];
}
export function getBudgets() {
    return DataManager.get("budgets") || [];
}

// === Funções de Escrita (Write) ===
export function saveProfileData(profileData) {
    DataManager.set("profile", profileData);
}
export function saveClientsData(clients) {
    DataManager.set("clients", clients);
}
export function saveBudgetsData(budgets) {
    DataManager.set("budgets", budgets);
}

// === Funções de Deleção (Delete) ===
/**
 * Deleta um cliente da lista e salva a nova lista.
 * @param {string} id - O ID do cliente a ser deletado.
 * @returns {boolean} - Retorna true se a exclusão foi confirmada.
 */
export function deleteClient(id) {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
        let clients = getClients();
        clients = clients.filter(c => c.id !== id);
        saveClientsData(clients);
        return true;
    }
    return false;
}

/**
 * Deleta um orçamento da lista e salva a nova lista.
 * @param {string} id - O ID do orçamento a ser deletado.
 * @returns {boolean} - Retorna true se a exclusão foi confirmada.
 */
export function deleteBudget(id) {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
        let budgets = getBudgets();
        budgets = budgets.filter(b => b.id !== id);
        saveBudgetsData(budgets);
        return true;
    }
    return false;
}