const negociacaoSection = document.getElementById("negociacaoSection");
const judicialSection = document.getElementById("judicialSection");
const painelSection = document.getElementById("painelSection");

document.getElementById("btnNegociacao").addEventListener("click", () => mostrarSecao("negociacao"));
document.getElementById("btnJudicial").addEventListener("click", () => mostrarSecao("judicial"));
document.getElementById("btnPainel").addEventListener("click", () => { mostrarSecao("painel"); atualizarPainel(); });

function mostrarSecao(secao) {
    negociacaoSection.style.display = secao === "negociacao" ? "block" : "none";
    judicialSection.style.display = secao === "judicial" ? "block" : "none";
    painelSection.style.display = secao === "painel" ? "block" : "none";
}

function formatarMoeda(valor) {
    if (valor == null || isNaN(valor)) valor = 0;
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataBR(dataStr) {
    if (!dataStr) return "-";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
}

function salvarDados(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

function carregarDados(chave) {
    return JSON.parse(localStorage.getItem(chave)) || [];
}

let negociacoes = carregarDados("negociacoes").map(n => ({
    valorOriginal: Number(n.valorOriginal) || 0,
    valorAcordo: Number(n.valorAcordo) || 0,
    valorParcela: Number(n.valorParcela) || 0,
    parcelas: Number(n.parcelas) || 1,
    diffPercent: n.diffPercent || 0,
    status: n.status || "Em andamento",
    pagamentos: n.pagamentos || [],
    codigo: n.codigo || "",
    razao: n.razao || ""
}));

let judiciais = carregarDados("judiciais").map(j => ({
    valorDivida: Number(j.valorDivida) || 0,
    valorPago: Number(j.valorPago) || 0,
    gastos: j.gastos || [],
    codigo: j.codigo || "",
    dataInclusao: j.dataInclusao || "",
    status: j.status || "Judicial"
}));

let negociacaoEditIndex = null;
let judicialEditIndex = null;

document.getElementById("formNegociacao").addEventListener("submit", function (e) {
    e.preventDefault();
    const codigo = document.getElementById("codigo").value;
    const razao = document.getElementById("razao").value;
    const valorOriginal = parseFloat(document.getElementById("valorOriginal").value) || 0;
    const valorAcordo = parseFloat(document.getElementById("valorAcordo").value) || 0;
    const parcelas = parseInt(document.getElementById("parcelas").value) || 1;

    const diffPercent = ((valorAcordo - valorOriginal) / valorOriginal * 100).toFixed(2);
    const valorParcela = (valorAcordo / parcelas).toFixed(2);

    const obj = {
        codigo,
        razao,
        valorOriginal,
        valorAcordo,
        diffPercent,
        parcelas,
        valorParcela,
        status: "Em andamento",
        pagamentos: []
    };

    if (negociacaoEditIndex !== null) {
        negociacoes[negociacaoEditIndex] = obj;
        negociacaoEditIndex = null;
    } else {
        negociacoes.push(obj);
    }

    salvarDados("negociacoes", negociacoes);
    atualizarTabelaNegociacao();
    this.reset();
});

function atualizarTabelaNegociacao() {
    const tbody = document.querySelector("#tabelaNegociacao tbody");
    tbody.innerHTML = "";

    negociacoes.forEach((n, index) => {
        const pagamentosArray = n.pagamentos || [];
        const parcelasPagas = pagamentosArray.length;
        const valorPago = pagamentosArray.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${n.codigo}</td>
            <td>${n.razao}</td>
            <td class="valor">${formatarMoeda(n.valorOriginal)}</td>
            <td class="valor">${formatarMoeda(n.valorAcordo)}</td>
            <td>${n.diffPercent}%</td>
            <td>${n.parcelas}</td>
            <td class="parcelas">${parcelasPagas}/${n.parcelas}</td>
            <td class="valorPago">${formatarMoeda(valorPago)}</td>
            <td class="valor">${formatarMoeda(parseFloat(n.valorParcela))}</td>
            <td>${parcelasPagas >= n.parcelas ? "Concluída" : n.status}</td>
            <td>
                <button class="editar" onclick="editarNegociacao(${index})">Editar</button>
                <button class="excluir" onclick="excluirNegociacao(${index})">Excluir</button>
                <button class="pagamentos" onclick="abrirModalPagamento(${index})">Pagamentos</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editarNegociacao(index) {
    const n = negociacoes[index];
    document.getElementById("codigo").value = n.codigo;
    document.getElementById("razao").value = n.razao;
    document.getElementById("valorOriginal").value = n.valorOriginal;
    document.getElementById("valorAcordo").value = n.valorAcordo;
    document.getElementById("parcelas").value = n.parcelas;
    negociacaoEditIndex = index;
}

function excluirNegociacao(index) {
    if (confirm("Deseja realmente excluir essa negociação?")) {
        negociacoes.splice(index, 1);
        salvarDados("negociacoes", negociacoes);
        atualizarTabelaNegociacao();
    }
}

const modalPagamentos = document.getElementById("modalPagamentos");
const listaPagamentos = document.getElementById("listaPagamentos");
let currentNegociacaoIndex = null;

function abrirModalPagamento(index) {
    modalPagamentos.style.display = "block";
    currentNegociacaoIndex = index;
    atualizarListaPagamentos();
}

document.getElementById("btnFecharModal").addEventListener("click", () => modalPagamentos.style.display = "none");

document.getElementById("btnAdicionarPagamento").addEventListener("click", () => {
    const data = document.getElementById("dataPagamento").value;
    const valor = parseFloat(document.getElementById("valorPagamento").value) || 0;

    if (data) {
        negociacoes[currentNegociacaoIndex].pagamentos.push({ data, valor });
        salvarDados("negociacoes", negociacoes);
        atualizarListaPagamentos();
        atualizarTabelaNegociacao();
        document.getElementById("dataPagamento").value = "";
        document.getElementById("valorPagamento").value = "";
    }
});

function atualizarListaPagamentos() {
    listaPagamentos.innerHTML = "";
    const pagamentosArray = negociacoes[currentNegociacaoIndex].pagamentos || [];

    pagamentosArray.forEach((p, i) => {
        const li = document.createElement("li");
        li.textContent = `Parcela ${i + 1} - ${formatarDataBR(p.data)} - ${formatarMoeda(p.valor)}`;
        listaPagamentos.appendChild(li);
    });
}

document.getElementById("formJudicial").addEventListener("submit", function (e) {
    e.preventDefault();
    const codigo = document.getElementById("codigoJud").value;
    const dataInclusao = document.getElementById("dataInclusao").value;
    const valorDivida = parseFloat(document.getElementById("valorDivida").value) || 0;
    const descricaoGasto = document.getElementById("descricaoGasto").value || "-";
    const valorGasto = parseFloat(document.getElementById("valorGasto").value) || 0;

    const obj = {
        codigo,
        dataInclusao,
        valorDivida,
        status: "Judicial",
        gastos: [{ descricao: descricaoGasto, valor: valorGasto }],
        valorPago: 0
    };

    if (judicialEditIndex !== null) {
        judiciais[judicialEditIndex] = obj;
        judicialEditIndex = null;
    } else {
        judiciais.push(obj);
    }

    salvarDados("judiciais", judiciais);
    atualizarTabelaJudicial();
    this.reset();
});

function atualizarTabelaJudicial() {
    const tbody = document.querySelector("#tabelaJudicial tbody");
    tbody.innerHTML = "";

    judiciais.forEach((j, index) => {
        const gastosArray = j.gastos || [];
        const totalGastos = gastosArray.reduce((acc, g) => acc + (Number(g.valor) || 0), 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${j.codigo}</td>
            <td>${formatarDataBR(j.dataInclusao)}</td>
            <td class="valor">${formatarMoeda(j.valorDivida)}</td>
            <td class="gasto">${formatarMoeda(totalGastos)}</td>
            <td class="valorPago">${formatarMoeda(j.valorPago)}</td>
            <td>${j.status}</td>
            <td>
                <button class="editar" onclick="editarJudicial(${index})">Editar</button>
                <button class="excluir" onclick="excluirJudicial(${index})">Excluir</button>
                <button class="pagamentos" onclick="abrirModalGasto(${index})">Adicionar Gastos</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editarJudicial(index) {
    const j = judiciais[index];
    document.getElementById("codigoJud").value = j.codigo;
    document.getElementById("dataInclusao").value = j.dataInclusao;
    document.getElementById("valorDivida").value = j.valorDivida;
    judicialEditIndex = index;
}

function excluirJudicial(index) {
    if (confirm("Deseja realmente excluir este processo judicial?")) {
        judiciais.splice(index, 1);
        salvarDados("judiciais", judiciais);
        atualizarTabelaJudicial();
    }
}

const modalGastos = document.getElementById("modalGastos");
const listaGastos = document.getElementById("listaGastos");
let currentJudicialIndex = null;

function abrirModalGasto(index) {
    modalGastos.style.display = "block";
    currentJudicialIndex = index;
    atualizarListaGastos();
}

document.getElementById("btnFecharGastoModal").addEventListener("click", () => modalGastos.style.display = "none");

document.getElementById("btnAdicionarGasto").addEventListener("click", () => {
    const descricao = document.getElementById("descricaoGastoModal").value || "-";
    const valor = parseFloat(document.getElementById("valorGastoModal").value) || 0;

    judiciais[currentJudicialIndex].gastos.push({ descricao, valor });
    salvarDados("judiciais", judiciais);
    atualizarListaGastos();
    atualizarTabelaJudicial();

    document.getElementById("descricaoGastoModal").value = "";
    document.getElementById("valorGastoModal").value = "";
});

function atualizarListaGastos() {
    listaGastos.innerHTML = "";
    const gastosArray = judiciais[currentJudicialIndex].gastos || [];
    gastosArray.forEach(g => {
        const li = document.createElement("li");
        li.textContent = `${g.descricao} - ${formatarMoeda(g.valor)}`;
        listaGastos.appendChild(li);
    });
}

function atualizarPainel() {
    const totalRecebido = negociacoes.reduce((acc, n) => acc + (n.pagamentos || []).reduce((a, p) => a + (Number(p.valor) || 0), 0), 0);
    const emAndamento = negociacoes.filter(n => n.status === "Em andamento").length;
    const judicialCount = judiciais.length;

    document.getElementById("resumoGeral").innerHTML = `
        <p>Total Recebido: ${formatarMoeda(totalRecebido)}</p>
        <p>Em Andamento: ${emAndamento}</p>
        <p>Judicial: ${judicialCount}</p>
    `;

    const tbody = document.querySelector("#tabelaPainel tbody");
    tbody.innerHTML = "";

    negociacoes.forEach(n => {
        const pagamentosArray = n.pagamentos || [];
        const parcelasPagas = pagamentosArray.length;
        const valorPago = pagamentosArray.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${n.codigo}</td>
            <td>${n.razao}</td>
            <td class="valor">${formatarMoeda(n.valorOriginal)}</td>
            <td class="valor">${formatarMoeda(n.valorAcordo)}</td>
            <td>${n.diffPercent}%</td>
            <td>${n.parcelas}</td>
            <td class="parcelas">${parcelasPagas}/${n.parcelas}</td>
            <td class="valorPago">${formatarMoeda(valorPago)}</td>
            <td class="valor">${formatarMoeda(parseFloat(n.valorParcela))}</td>
            <td>${parcelasPagas >= n.parcelas ? "Concluída" : n.status}</td>
        `;
        tbody.appendChild(tr);
    });

    judiciais.forEach(j => {
        const totalGastos = (j.gastos || []).reduce((acc, g) => acc + (Number(g.valor) || 0), 0);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${j.codigo}</td>
            <td>-</td>
            <td>-</td>
            <td class="valor">${formatarMoeda(j.valorDivida)}</td>
            <td>-</td>
            <td>-</td>
            <td class="parcelas">-</td>
            <td class="valorPago">${formatarMoeda(totalGastos)}</td>
            <td>-</td>
            <td>Judicial</td>
        `;
        tbody.appendChild(tr);
    });
}

atualizarTabelaNegociacao();
atualizarTabelaJudicial();
