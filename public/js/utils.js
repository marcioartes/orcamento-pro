// js/utils.js

/**
 * Formata um input para CPF (se tiver até 11 dígitos) ou
 * CNPJ (se tiver mais de 11 dígitos) automaticamente,
 * limpando caracteres não numéricos.
 * @param {HTMLElement} input - O elemento input a ser formatado.
 */
export function formatCpfCnpj(input) {
  // 1. Pega o valor atual e remove tudo que não for dígito.
  let value = input.value.replace(/\D/g, '');

  // 2. Limita o valor a 14 dígitos (tamanho máximo de um CNPJ).
  const maxLength = 14;
  value = value.substring(0, maxLength);

  // 3. Aplica a máscara de CNPJ se o comprimento for maior que 11.
  if (value.length > 11) {
    // Máscara de CNPJ: XX.XXX.XXX/XXXX-XX
    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  } else {
    // Aplica a máscara de CPF para qualquer outro comprimento.
    // Máscara de CPF: XXX.XXX.XXX-XX
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  // 4. Devolve o valor formatado para o campo.
  input.value = value;
}