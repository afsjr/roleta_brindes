// Testes Unitários de Regras de Negócio e Validações
// Pode ser executado diretamente com: node test-unit.js

const assert = require('assert');

// 1. Algoritmo de Validação de CPF
function validarCPF(cpfLimpo) {
    const cpf = cpfLimpo.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
}

// 2. Máscara de Telefone
function mascaraTelefone(valor) {
    let v = valor.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
        return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 5) {
        return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
        return v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (v.length > 0) {
        return v.replace(/^(\d*)$/, '($1');
    }
    return v;
}

// 3. Sorteio Ponderado
function sortearPonderado(beneficios) {
    const totalPeso = beneficios.reduce((sum, b) => sum + (b.peso || 1), 0);
    let random = Math.random() * totalPeso;
    for (let i = 0; i < beneficios.length; i++) {
        const peso = beneficios[i].peso || 1;
        if (random < peso) return beneficios[i];
        random -= peso;
    }
    return beneficios[0];
}

console.log("Iniciando testes unitários...");

// Teste 1: CPF inválido com números repetidos
assert.strictEqual(validarCPF("111.111.111-11"), false, "CPF repetido deve falhar");
assert.strictEqual(validarCPF("123.456.789-00"), false, "CPF com DV errado deve falhar");
assert.strictEqual(validarCPF(""), false, "CPF vazio deve retornar false");
console.log("✓ Testes de CPF inválido passaram");

// Teste 2: CPF válido conhecido (exemplo de teste)
// 52998224725 é um CPF válido para testes
assert.strictEqual(validarCPF("52998224725"), true, "CPF válido deve passar");
assert.strictEqual(validarCPF("529.982.247-25"), true, "CPF formatado válido deve passar");
console.log("✓ Testes de CPF válido passaram");

// Teste 3: Máscara de telefone
assert.strictEqual(mascaraTelefone("11988887777"), "(11) 98888-7777", "Máscara celular SP");
assert.strictEqual(mascaraTelefone("1133334444"), "(11) 3333-4444", "Máscara fixo SP");
console.log("✓ Testes de máscara de telefone passaram");

// Teste 4: Sorteio ponderado nunca retorna benefício inexistente
const lista = [
    { id: '1', nome: 'A', peso: 1 },
    { id: '2', nome: 'B', peso: 10 }
];
const contagem = { A: 0, B: 0 };
for (let i = 0; i < 1000; i++) {
    const sorteado = sortearPonderado(lista);
    contagem[sorteado.nome]++;
}
assert.ok(contagem.B > contagem.A, "Item com peso 10 deve ser sorteado mais vezes que peso 1");
console.log(`✓ Teste de sorteio ponderado passou (A: ${contagem.A}, B: ${contagem.B})`);

console.log("\nTODOS OS TESTES UNITÁRIOS PASSARAM COM SUCESSO! 🎉");
