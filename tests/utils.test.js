const test = require('node:test');
const assert = require('node:assert/strict');
const Utils = require('../js/utils.js');

test('valida CPF com e sem máscara', () => {
    assert.equal(Utils.validarCPF('52998224725'), true);
    assert.equal(Utils.validarCPF('529.982.247-25'), true);
    assert.equal(Utils.validarCPF('111.111.111-11'), false);
    assert.equal(Utils.validarCPF('123.456.789-00'), false);
    assert.equal(Utils.validarCPF(''), false);
});

test('aplica máscara de telefone brasileiro', () => {
    assert.equal(Utils.mascaraTelefone('11988887777'), '(11) 98888-7777');
    assert.equal(Utils.mascaraTelefone('1133334444'), '(11) 3333-4444');
    assert.equal(Utils.mascaraTelefone(''), '');
});

test('aplica máscara de CPF', () => {
    assert.equal(Utils.mascaraCPF('52998224725'), '529.982.247-25');
    assert.equal(Utils.mascaraCPF('529'), '529');
});

test('gera UUID v4 válido', () => {
    const uuid = Utils.uuidV4();
    assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.notEqual(Utils.uuidV4(), uuid);
});

test('sorteio ponderado respeita os pesos', () => {
    const lista = [
        { id: 'a', nome: 'A', peso: 1 },
        { id: 'b', nome: 'B', peso: 10 }
    ];

    assert.equal(Utils.sortearPonderado(lista, () => 0).item.id, 'a');
    assert.equal(Utils.sortearPonderado(lista, () => 0.5).item.id, 'b');
    assert.equal(Utils.sortearPonderado(lista, () => 0.999).item.id, 'b');
    assert.equal(Utils.sortearPonderado([], () => 0.5), null);
});

test('normaliza telefone e CPF', () => {
    assert.equal(Utils.normalizarTelefone('(11) 98888-7777'), '11988887777');
    assert.equal(Utils.normalizarCPF('529.982.247-25'), '52998224725');
});

test('escapa HTML', () => {
    assert.equal(Utils.escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});

test('protege CSV contra fórmula', () => {
    assert.equal(Utils.csvCell('=SUM(A1:A2)'), '"\'=SUM(A1:A2)"');
    assert.equal(Utils.csvCell('Maria "Silva"'), '"Maria ""Silva"""');
    assert.equal(Utils.csvCell(null), '""');
});

test('detecta configuração válida do Supabase', () => {
    assert.equal(Utils.supabaseConfigurado(null), false);
    assert.equal(Utils.supabaseConfigurado({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }), false);
    assert.equal(Utils.supabaseConfigurado({
        SUPABASE_URL: 'https://xyzcompany.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key'
    }), false);
    assert.equal(Utils.supabaseConfigurado({
        SUPABASE_URL: 'https://abcdefghij.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmnop'
    }), true);
});
