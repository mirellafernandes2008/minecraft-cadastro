
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const app = express();

// Permite receber dados em JSON
app.use(express.json());

// Carrega as configurações do banco de dados
let localConfig = {};

try {
    const caminhoConfig = path.join(__dirname, 'config.json');

    if (fs.existsSync(caminhoConfig)) {
        localConfig = JSON.parse(
            fs.readFileSync(caminhoConfig, 'utf8')
        );
    }
} catch (erro) {
    console.error('Erro ao carregar config.json:', erro.message);
}

// Aceita configurações locais ou variáveis de ambiente
const dbConfig = localConfig.mysql || localConfig;

const db = mysql.createPool({
    host:
        process.env.MYSQLHOST ||
        process.env.DB_HOST ||
        dbConfig.host,

    port: Number(
        process.env.MYSQLPORT ||
        process.env.DB_PORT ||
        dbConfig.port ||
        3306
    ),

    user:
        process.env.MYSQLUSER ||
        process.env.DB_USER ||
        dbConfig.user,

    password:
        process.env.MYSQLPASSWORD ||
        process.env.DB_PASSWORD ||
        dbConfig.password,

    database:
        process.env.MYSQLDATABASE ||
        process.env.DB_NAME ||
        (typeof dbConfig.database === 'string'
            ? dbConfig.database
            : dbConfig.database?.name) ||
        dbConfig.databaseName,

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

// Disponibiliza os arquivos da pasta public
app.use(express.static(path.join(__dirname, 'public')));


// ==========================================
// VALIDAÇÕES
// ==========================================

function validarJogador(dados) {
    const { nome, data_nascimento, nickname } = dados;

    if (
        typeof nome !== 'string' ||
        nome.trim().length < 2 ||
        nome.trim().length > 100
    ) {
        return 'Informe um nome válido.';
    }

    if (
        typeof nickname !== 'string' ||
        !/^[A-Za-z0-9_]{3,16}$/.test(nickname.trim())
    ) {
        return 'O nickname deve ter entre 3 e 16 caracteres, usando apenas letras, números e _.';
    }

    if (
        typeof data_nascimento !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data_nascimento)
    ) {
        return 'Informe uma data de nascimento válida.';
    }

    const data = new Date(`${data_nascimento}T00:00:00`);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (
        Number.isNaN(data.getTime()) ||
        data.toISOString().slice(0, 10) !== data_nascimento ||
        data > hoje
    ) {
        return 'A data de nascimento não pode ser inválida ou futura.';
    }

    return null;
}


// ==========================================
// CRUD DE JOGADORES
// ==========================================

// Listar jogadores
app.get('/jogadores', async (req, res) => {
    try {
        const [jogadores] = await db.execute(
            'SELECT * FROM jogadores ORDER BY id DESC'
        );

        res.json(jogadores);

    } catch (erro) {
        console.error('Erro ao listar jogadores:', erro.message);
        res.status(500).json({
            erro: 'Não foi possível listar os jogadores.'
        });
    }
});


// Cadastrar jogador
app.post('/jogadores', async (req, res) => {
    try {
        const erroValidacao = validarJogador(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const { nome, data_nascimento, nickname } = req.body;

        const [resultado] = await db.execute(
            `INSERT INTO jogadores
            (nome, data_nascimento, nickname)
            VALUES (?, ?, ?)`,
            [
                nome.trim(),
                data_nascimento,
                nickname.trim()
            ]
        );

        res.status(201).json({
            mensagem: 'Jogador cadastrado com sucesso!',
            id: resultado.insertId
        });

    } catch (erro) {
        console.error('Erro ao cadastrar jogador:', erro.message);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Esse nickname já está cadastrado.'
            });
        }

        res.status(500).json({
            erro: 'Não foi possível cadastrar o jogador.'
        });
    }
});


// Atualizar jogador
app.put('/jogadores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'ID inválido.'
            });
        }

        const erroValidacao = validarJogador(req.body);

        if (erroValidacao) {
            return res.status(400).json({
                erro: erroValidacao
            });
        }

        const { nome, data_nascimento, nickname } = req.body;

        const [resultado] = await db.execute(
            `UPDATE jogadores
             SET nome = ?, data_nascimento = ?, nickname = ?
             WHERE id = ?`,
            [
                nome.trim(),
                data_nascimento,
                nickname.trim(),
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: 'Jogador não encontrado.'
            });
        }

        res.json({
            mensagem: 'Jogador atualizado com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao atualizar jogador:', erro.message);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Esse nickname já está cadastrado.'
            });
        }

        res.status(500).json({
            erro: 'Não foi possível atualizar o jogador.'
        });
    }
});


// Excluir jogador
app.delete('/jogadores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: 'ID inválido.'
            });
        }

        const [resultado] = await db.execute(
            'DELETE FROM jogadores WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: 'Jogador não encontrado.'
            });
        }

        res.json({
            mensagem: 'Jogador excluído com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao excluir jogador:', erro.message);
        res.status(500).json({
            erro: 'Não foi possível excluir o jogador.'
        });
    }
});


// ==========================================
// JOGO DA MEMÓRIA - VERIFICAR NICKNAME
// ==========================================

app.get('/jogadores/validar/:nickname', async (req, res) => {
    try {
        const nickname = req.params.nickname.trim();

        if (!/^[A-Za-z0-9_]{3,16}$/.test(nickname)) {
            return res.status(400).json({
                erro: 'Nickname inválido.',
                cadastrado: false
            });
        }

        const [resultado] = await db.execute(
            `SELECT id FROM jogadores
             WHERE LOWER(nickname) = LOWER(?)
             LIMIT 1`,
            [nickname]
        );

        res.json({
            cadastrado: resultado.length > 0
        });

    } catch (erro) {
        console.error('Erro ao verificar nickname:', erro.message);
        res.status(500).json({
            erro: 'Erro ao verificar jogador.'
        });
    }
});


// ==========================================
// JOGO DA MEMÓRIA - SALVAR PARTIDA
// ==========================================

app.post('/partidas', async (req, res) => {
    try {
        const { nickname, tempo_segundos, tentativas } = req.body;

        if (
            typeof nickname !== 'string' ||
            !/^[A-Za-z0-9_]{3,16}$/.test(nickname.trim()) ||
            !Number.isInteger(tempo_segundos) ||
            tempo_segundos < 1 ||
            tempo_segundos > 36000 ||
            !Number.isInteger(tentativas) ||
            tentativas < 8 ||
            tentativas > 5000
        ) {
            return res.status(400).json({
                erro: 'Dados da partida inválidos.'
            });
        }

        // Confere se o jogador está cadastrado
        const [jogador] = await db.execute(
            `SELECT id FROM jogadores
             WHERE LOWER(nickname) = LOWER(?)
             LIMIT 1`,
            [nickname.trim()]
        );

        if (jogador.length === 0) {
            return res.status(404).json({
                erro: 'Nickname não cadastrado.'
            });
        }

        // Salva o resultado no banco de dados
        await db.execute(
            `INSERT INTO ranking_memoria
            (nickname, tempo_segundos, tentativas)
            VALUES (?, ?, ?)`,
            [
                nickname.trim(),
                tempo_segundos,
                tentativas
            ]
        );

        res.status(201).json({
            mensagem: 'Resultado salvo com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao salvar partida:', erro.message);
        res.status(500).json({
            erro: 'Não foi possível salvar o resultado.'
        });
    }
});


// ==========================================
// JOGO DA MEMÓRIA - RANKING
// ==========================================

app.get('/ranking', async (req, res) => {
    try {
        const [resultados] = await db.execute(
            `SELECT nickname, tempo_segundos, tentativas, data_partida, id
             FROM ranking_memoria
             ORDER BY tempo_segundos ASC, tentativas ASC, id ASC`
        );

        const melhores = [];
        const jogadores = new Set();

        // Considera somente o melhor resultado de cada jogador
        for (const partida of resultados) {
            const chave = partida.nickname.toLowerCase();

            if (!jogadores.has(chave)) {
                jogadores.add(chave);
                melhores.push(partida);
            }

            if (melhores.length === 3) {
                break;
            }
        }

        res.json(melhores);

    } catch (erro) {
        console.error('Erro ao buscar ranking:', erro.message);
        res.status(500).json({
            erro: 'Não foi possível carregar o ranking.'
        });
    }
});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

async function iniciar() {
    try {
        // Cria a tabela do ranking caso ainda não exista
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ranking_memoria (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nickname VARCHAR(16) NOT NULL,
                tempo_segundos INT NOT NULL,
                tentativas INT NOT NULL,
                data_partida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Testa a conexão com o MySQL
        await db.execute('SELECT 1');

        console.log('Conexão com MySQL realizada com sucesso!');

        const porta = process.env.PORT || localConfig.appPort || 3000;

        app.listen(porta, '0.0.0.0', () => {
            console.log('Minecraft Cadastro iniciado!');
            console.log(`Servidor funcionando na porta ${porta}`);
        });

    } catch (erro) {
        console.error('Erro ao iniciar o servidor:', erro.message);
        process.exit(1);
    }
}

iniciar();
