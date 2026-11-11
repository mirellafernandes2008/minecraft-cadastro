
const formulario = document.querySelector('#formulario');
const lista = document.querySelector('#listaJogadores');
const mensagem = document.querySelector('#mensagem');
const botaoSalvar = document.querySelector('#botaoSalvar');
const cancelar = document.querySelector('#cancelar');

let idEdicao = null;

function mostrarMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.className = erro ? 'erro' : 'sucesso';
}

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro na operação.');
    }

    return dados;
}

// Carregar jogadores cadastrados
async function carregarJogadores() {
    const jogadores = await requisicao('/jogadores');

    lista.replaceChildren();

    if (jogadores.length === 0) {
        const linha = lista.insertRow();
        const celula = linha.insertCell();

        celula.colSpan = 5;
        celula.textContent = 'Nenhum jogador cadastrado.';
        return;
    }

    jogadores.forEach(jogador => {
        const linha = lista.insertRow();

        linha.insertCell().textContent = jogador.id;
        linha.insertCell().textContent = jogador.nome;
        linha.insertCell().textContent =
            new Date(jogador.data_nascimento).toLocaleDateString('pt-BR');

        linha.insertCell().textContent = jogador.nickname;

        const acoes = linha.insertCell();

        const editar = document.createElement('button');
        editar.textContent = 'Editar';
        editar.className = 'editar';

        editar.onclick = () => editarJogador(jogador);

        const excluir = document.createElement('button');
        excluir.textContent = 'Excluir';
        excluir.className = 'excluir';

        excluir.onclick = () => excluirJogador(jogador);

        acoes.append(editar, excluir);
    });
}

// Cadastrar ou atualizar jogador
formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const dados = {
        nome: document.querySelector('#nome').value.trim(),
        data_nascimento:
            document.querySelector('#data_nascimento').value,
        nickname: document.querySelector('#nickname').value.trim()
    };

    const editando = idEdicao !== null;

    botaoSalvar.disabled = true;

    try {
        await requisicao(
            editando ? `/jogadores/${idEdicao}` : '/jogadores',
            {
                method: editando ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            }
        );

        limparFormulario();

        await carregarJogadores();

        mostrarMensagem(
            editando
                ? 'Jogador atualizado com sucesso!'
                : 'Jogador cadastrado com sucesso!'
        );

    } catch (erro) {
        mostrarMensagem(erro.message, true);

    } finally {
        botaoSalvar.disabled = false;
    }
});

// Preparar edição
function editarJogador(jogador) {
    idEdicao = jogador.id;

    document.querySelector('#nome').value = jogador.nome;

    document.querySelector('#data_nascimento').value =
        new Date(jogador.data_nascimento).toISOString().slice(0, 10);

    document.querySelector('#nickname').value = jogador.nickname;

    botaoSalvar.textContent = 'SALVAR ALTERAÇÕES';
    cancelar.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Excluir jogador
async function excluirJogador(jogador) {
    const confirmar = confirm(
        `Deseja excluir o jogador ${jogador.nickname}?`
    );

    if (!confirmar) return;

    try {
        await requisicao(`/jogadores/${jogador.id}`, {
            method: 'DELETE'
        });

        if (idEdicao === jogador.id) {
            limparFormulario();
        }

        await carregarJogadores();

        mostrarMensagem('Jogador excluído com sucesso!');

    } catch (erro) {
        mostrarMensagem(erro.message, true);
    }
}

// Limpar formulário
function limparFormulario() {
    formulario.reset();

    idEdicao = null;

    botaoSalvar.textContent = 'CADASTRAR JOGADOR';

    cancelar.hidden = true;
}

cancelar.addEventListener('click', limparFormulario);

// Carregar lista ao abrir o site
carregarJogadores().catch(erro => {
    mostrarMensagem(erro.message, true);
});
