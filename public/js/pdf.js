// js/pdf.js
import { getBudgets, getClients, getProfile } from './database.js';

/**
 * Gera e abre uma janela de impressão com o orçamento em formato de PDF.
 * @param {string} id - O ID do orçamento a ser exportado.
 */
export function exportBudgetPDF(id) {
    const budgets = getBudgets();
    const budget = budgets.find(b => b.id === id);
    if (!budget) {
        alert("Orçamento não encontrado!");
        return;
    }

    const clients = getClients();
    const profile = getProfile();
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