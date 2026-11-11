
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração local ou variáveis do Railway
const configPath = path.join(__dirname, 'config.json');

const localConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : {};

const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || localConfig.host,
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || localConfig.port || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || localConfig.user,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || localConfig.password,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || localConfig.database,
    waitForConnections: true,
    connectionLimit: 5
};

const db = mysql.createPool(dbConfig);

function validar(dados) {
    if (!dados ||
        typeof dados.nome !== 'string' ||
        typeof dados.data_nascimento !== 'string' ||
        typeof dados.nickname !== 'string') {
        return false;
    }

    const nome = dados.nome.trim();
    const nickname = dados.nickname.trim();
    const nascimento = dados.data_nascimento;

    if (!nome || nome.length > 100) return false;

    if (!/^[A-Za-z0-9_]{3,16}$/.test(nickname)) {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) {
        return false;
    }

    const data = new Date(nascimento + 'T00:00:00Z');

    if (Number.isNaN(data.getTime()) ||
        data.toISOString().slice(0, 10) !== nascimento) {
        return false;
    }

    if (nascimento > new Date().toISOString().slice(0, 10)) {
        return false;
    }

    return {
        nome,
        data_nascimento: nascimento,
        nickname
    };
}

// Listar jogadores
app.get('/jogadores', async (req, res) => {
    try {
        const [jogadores] = await db.execute(
            'SELECT * FROM jogadores ORDER BY id DESC'
        );

        res.json(jogadores);
    } catch (erro) {
        console.error('Erro ao listar:', erro.message);
        res.status(500).json({ erro: 'Erro ao carregar jogadores.' });
    }
});

// Cadastrar jogador
app.post('/jogadores', async (req, res) => {
    try {
        const dados = validar(req.body);

        if (!dados) {
            return res.status(400).json({
                erro: 'Confira os dados informados.'
            });
        }

        const [resultado] = await db.execute(
            `INSERT INTO jogadores
            (nome, data_nascimento, nickname)
            VALUES (?, ?, ?)`,
            [
                dados.nome,
                dados.data_nascimento,
                dados.nickname
            ]
        );

        res.status(201).json({
            mensagem: 'Jogador cadastrado!',
            id: resultado.insertId
        });

    } catch (erro) {
        console.error('Erro ao cadastrar:', erro.message);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Esse nickname já está cadastrado.'
            });
        }

        res.status(500).json({ erro: 'Erro ao cadastrar jogador.' });
    }
});

// Editar jogador
app.put('/jogadores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const dados = validar(req.body);

        if (!Number.isSafeInteger(id) || id < 1 || !dados) {
            return res.status(400).json({
                erro: 'Dados inválidos.'
            });
        }

        const [resultado] = await db.execute(
            `UPDATE jogadores
            SET nome = ?, data_nascimento = ?, nickname = ?
            WHERE id = ?`,
            [
                dados.nome,
                dados.data_nascimento,
                dados.nickname,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: 'Jogador não encontrado.'
            });
        }

        res.json({ mensagem: 'Jogador atualizado!' });

    } catch (erro) {
        console.error('Erro ao editar:', erro.message);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Esse nickname já está cadastrado.'
            });
        }

        res.status(500).json({ erro: 'Erro ao editar jogador.' });
    }
});

// Excluir jogador
app.delete('/jogadores/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
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

        res.json({ mensagem: 'Jogador excluído!' });

    } catch (erro) {
        console.error('Erro ao excluir:', erro.message);
        res.status(500).json({ erro: 'Erro ao excluir jogador.' });
    }
});

// Iniciar servidor
async function iniciar() {
    if (!dbConfig.host || !dbConfig.user ||
        !dbConfig.password || !dbConfig.database) {
        throw new Error('Configure as variáveis de conexão do MySQL.');
    }

    await db.execute('SELECT 1');

    const porta = Number(process.env.PORT || localConfig.appPort || 3000);

    app.listen(porta, '0.0.0.0', () => {
        console.log('Minecraft Cadastro iniciado!');
        console.log(`Servidor funcionando na porta ${porta}`);
    });
}

iniciar().catch(erro => {
    console.error('Erro ao iniciar:', erro.message);
    process.exit(1);
});
