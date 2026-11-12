
// ITENS DO JOGO
const elementos = [
    { nome: "Espada", simbolo: "⚔️" },
    { nome: "Picareta", simbolo: "⛏️" },
    { nome: "Diamante", simbolo: "💎" },
    { nome: "Esmeralda", simbolo: "🟢" },
    { nome: "Creeper", simbolo: "💚" },
    { nome: "TNT", simbolo: "🧨" },
    { nome: "Baú", simbolo: "📦" },
    { nome: "Maçã dourada", simbolo: "🍎" }
];

// ELEMENTOS DO HTML
const inicio = document.getElementById("inicio");
const nicknameInput = document.getElementById("nickname");
const mensagem = document.getElementById("mensagem");
const btnIniciar = document.getElementById("btnIniciar");
const rankingInicial = document.getElementById("rankingInicial");

const areaJogo = document.getElementById("areaJogo");
const jogadorAtual = document.getElementById("jogadorAtual");
const tempoElemento = document.getElementById("tempo");
const tentativasElemento = document.getElementById("tentativas");
const paresElemento = document.getElementById("pares");
const tabuleiro = document.getElementById("tabuleiro");

const resultado = document.getElementById("resultado");
const tempoFinal = document.getElementById("tempoFinal");
const tentativasFinais = document.getElementById("tentativasFinais");
const mensagemResultado = document.getElementById("mensagemResultado");
const podio = document.getElementById("podio");
const btnNovamente = document.getElementById("btnNovamente");

// VARIÁVEIS DO JOGO
let primeiraCarta = null;
let segundaCarta = null;
let bloqueado = false;
let tentativas = 0;
let paresEncontrados = 0;
let tempo = 0;
let cronometro = null;
let nickname = "";

// CONTROLE DAS TELAS
function mostrarTela(tela) {
    inicio.hidden = tela !== "inicio";
    areaJogo.hidden = tela !== "jogo";
    resultado.hidden = tela !== "resultado";

    inicio.style.display = tela === "inicio" ? "block" : "none";
    areaJogo.style.display = tela === "jogo" ? "block" : "none";
    resultado.style.display = tela === "resultado" ? "block" : "none";
}

// GARANTE QUE A TELA INICIAL APAREÇA AO ABRIR O SITE
mostrarTela("inicio");

// EMBARALHAR CARTAS
function embaralhar(lista) {
    const copia = [...lista];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}

// FORMATAR TEMPO
function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;

    return `${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;
}

// ATUALIZAR INFORMAÇÕES
function atualizarInformacoes() {
    tempoElemento.textContent = formatarTempo(tempo);
    tentativasElemento.textContent = tentativas;
    paresElemento.textContent = `${paresEncontrados}/8`;
}

// CRONÔMETRO
function iniciarCronometro() {
    clearInterval(cronometro);

    cronometro = setInterval(() => {
        tempo++;
        tempoElemento.textContent = formatarTempo(tempo);
    }, 1000);
}

// VALIDAR NICKNAME NO BANCO DE DADOS
async function validarNickname() {
    const nomeDigitado = nicknameInput.value.trim();

    if (!nomeDigitado) {
        mensagem.textContent = "Digite seu nickname do Minecraft!";
        nicknameInput.focus();
        return false;
    }

    mensagem.textContent = "Verificando cadastro...";

    try {
        const resposta = await fetch(
            `/jogadores/validar/${encodeURIComponent(nomeDigitado)}`
        );

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (dados.cadastrado !== true) {
            mensagem.textContent =
                "Jogador não cadastrado. Faça seu cadastro primeiro!";
            return false;
        }

        nickname = nomeDigitado;
        mensagem.textContent = "";

        return true;

    } catch (erro) {
        console.error("Erro ao validar nickname:", erro);

        mensagem.textContent =
            "Não foi possível verificar seu cadastro. Confira se o servidor está funcionando.";

        return false;
    }
}

// CRIAR CARTA
function criarCarta(elemento) {
    const carta = document.createElement("button");

    carta.type = "button";
    carta.className = "carta";
    carta.dataset.nome = elemento.nome;
    carta.setAttribute("aria-label", "Carta fechada");

    const interrogacao = document.createElement("span");
    interrogacao.className = "interrogacao";
    interrogacao.textContent = "?";

    const simbolo = document.createElement("span");
    simbolo.className = "simbolo";
    simbolo.textContent = elemento.simbolo;
    simbolo.style.display = "none";
    simbolo.style.fontSize = "42px";

    carta.appendChild(interrogacao);
    carta.appendChild(simbolo);

    carta.addEventListener("click", () => {
        virarCarta(carta);
    });

    return carta;
}

// INICIAR JOGO
function iniciarJogo() {
    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;
    tentativas = 0;
    paresEncontrados = 0;
    tempo = 0;

    clearInterval(cronometro);

    tabuleiro.replaceChildren();

    const cartas = embaralhar([
        ...elementos,
        ...elementos
    ]);

    cartas.forEach(elemento => {
        tabuleiro.appendChild(criarCarta(elemento));
    });

    jogadorAtual.textContent = nickname;

    atualizarInformacoes();

    mostrarTela("jogo");
    iniciarCronometro();
}

// VIRAR CARTA
function virarCarta(carta) {
    if (
        bloqueado ||
        carta === primeiraCarta ||
        carta.classList.contains("encontrada") ||
        carta.classList.contains("virada")
    ) {
        return;
    }

    carta.classList.add("virada");

    carta.querySelector(".interrogacao").style.display = "none";
    carta.querySelector(".simbolo").style.display = "inline";

    carta.setAttribute("aria-label", carta.dataset.nome);

    if (primeiraCarta === null) {
        primeiraCarta = carta;
        return;
    }

    segundaCarta = carta;
    tentativas++;

    atualizarInformacoes();
    verificarPar();
}

// VERIFICAR SE AS CARTAS SÃO IGUAIS
function verificarPar() {
    const nome1 = primeiraCarta.dataset.nome;
    const nome2 = segundaCarta.dataset.nome;

    if (nome1 === nome2) {
        primeiraCarta.classList.add("encontrada");
        segundaCarta.classList.add("encontrada");

        paresEncontrados++;

        primeiraCarta = null;
        segundaCarta = null;

        atualizarInformacoes();

        if (paresEncontrados === elementos.length) {
            finalizarJogo();
        }

        return;
    }

    bloqueado = true;

    setTimeout(() => {
        primeiraCarta.classList.remove("virada");
        segundaCarta.classList.remove("virada");

        primeiraCarta.querySelector(".interrogacao").style.display = "inline";
        primeiraCarta.querySelector(".simbolo").style.display = "none";

        segundaCarta.querySelector(".interrogacao").style.display = "inline";
        segundaCarta.querySelector(".simbolo").style.display = "none";

        primeiraCarta.setAttribute("aria-label", "Carta fechada");
        segundaCarta.setAttribute("aria-label", "Carta fechada");

        primeiraCarta = null;
        segundaCarta = null;
        bloqueado = false;

    }, 900);
}

// SALVAR PARTIDA NO MYSQL
async function salvarResultado() {
    try {
        const resposta = await fetch("/partidas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nickname: nickname,
                tempo_segundos: tempo,
                tentativas: tentativas
            })
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        return true;

    } catch (erro) {
        console.error("Erro ao salvar partida:", erro);

        mensagemResultado.textContent =
            "Partida concluída, mas houve um erro ao salvar o resultado.";

        return false;
    }
}

// BUSCAR RANKING
async function buscarRanking() {
    try {
        const resposta = await fetch("/ranking");

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (Array.isArray(dados)) {
            return dados;
        }

        return dados.ranking || [];

    } catch (erro) {
        console.error("Erro ao buscar ranking:", erro);
        return [];
    }
}

// MOSTRAR RANKING
function mostrarRanking(lista, elemento) {
    elemento.replaceChildren();

    if (!lista.length) {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhuma partida registrada ainda.";
        elemento.appendChild(aviso);
        return;
    }

    lista.slice(0, 5).forEach((jogador, indice) => {
        const linha = document.createElement("div");
        linha.className = "item-ranking";

        const nome = document.createElement("span");
        nome.textContent =
            `${indice + 1}º ${jogador.nickname || jogador.nome || "Jogador"}`;

        const pontuacao = document.createElement("span");

        const tempoJogador = Number(
            jogador.tempo_segundos ?? jogador.tempo ?? 0
        );

        pontuacao.textContent = formatarTempo(tempoJogador);

        linha.appendChild(nome);
        linha.appendChild(pontuacao);

        elemento.appendChild(linha);
    });
}

// ATUALIZAR RANKING E PÓDIO
async function atualizarRanking() {
    const lista = await buscarRanking();

    mostrarRanking(lista, rankingInicial);
    mostrarRanking(lista, podio);
}

// FINALIZAR PARTIDA
async function finalizarJogo() {
    clearInterval(cronometro);
    bloqueado = true;

    tempoFinal.textContent = formatarTempo(tempo);
    tentativasFinais.textContent = `Total de tentativas: ${tentativas}`;

    mensagemResultado.textContent =
        "Parabéns! Você encontrou todos os pares!";

    mostrarTela("resultado");

    await salvarResultado();
    await atualizarRanking();
}

// BOTÃO INICIAR
btnIniciar.addEventListener("click", async () => {
    btnIniciar.disabled = true;

    const jogadorValido = await validarNickname();

    if (jogadorValido) {
        iniciarJogo();
    }

    btnIniciar.disabled = false;
});

// APERTAR ENTER PARA INICIAR
nicknameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        btnIniciar.click();
    }
});

// JOGAR NOVAMENTE
btnNovamente.addEventListener("click", () => {
    clearInterval(cronometro);

    nicknameInput.value = "";
    nickname = "";
    mensagem.textContent = "";
    mensagemResultado.textContent = "";

    mostrarTela("inicio");
    nicknameInput.focus();
});

// CARREGAR RANKING AO ABRIR A PÁGINA
atualizarRanking();
