# AC3 - Cadastro de alunos com Node.js e MySQL
Prof. Nilvan Garcia de Almeida | UniFECAF

## Objetivo e arquitetura
Construir um CRUD: Create (criar), Read (consultar), Update (atualizar) e Delete (excluir).
Uma VM executa o MySQL e a aplicação Node.js. O navegador exibe HTML/CSS e JavaScript.
O navegador chama `/alunos`; o servidor executa SQL e devolve JSON. A senha do banco fica apenas no servidor.
Não é necessário IIS, Live Server ou ngrok para esta atividade.

## 1. Preparar a VM
Instale o sistema operacional, MySQL Server, Node.js (versão 22 ou superior) e VS Code.
MySQL Workbench é opcional, mas facilita executar o SQL. Verifique que o serviço MySQL está iniciado.
Extraia este pacote. No VS Code, use **Arquivo > Abrir Pasta** e selecione `projeto_AC3` (a pasta com package.json).
Abra **Terminal > Novo Terminal** e confira:
```sh
node --version
npm --version
```

## 2. Criar o banco e o usuário
No Workbench, conecte como administrador, abra `script.sql` e substitua `DEFINA_A_SENHA_DO_USUARIO`
por uma senha escolhida para o laboratório. Execute o script inteiro.
Ele cria `escola`, a tabela `alunos`, duas amostras e o usuário local `cruduser` com permissões de CRUD.
A senha deve ser igual à que será preenchida em config.json. Não use a conta root na aplicação.
Se preferir o cliente de terminal MySQL, entre com `mysql -u root -p` e execute `SOURCE` seguido do caminho completo do script.

Se `cruduser` já existir, o script preserva a senha anterior. Para alterá-la, execute como administrador:
```sql
ALTER USER 'cruduser'@'localhost' IDENTIFIED BY 'SUA_SENHA';
```
Troque SUA_SENHA pelo valor escolhido. O script não apaga uma tabela existente nem altera sua estrutura.

## 3. Configurar a aplicação
Copie `config.example.json` e renomeie a cópia para `config.json` na mesma pasta.
Preencha `password` com a senha definida no SQL. Mantenha host `127.0.0.1`, porta MySQL `3306`,
usuário `cruduser`, banco `escola` e porta da aplicação `3000`, salvo se seu ambiente usar outros valores.
Use aspas duplas e não coloque comentários dentro do JSON. Não compartilhe config.json com sua senha.
Este roteiro usa uma VM; não é necessário configurar um servidor de banco remoto.

## 4. Instalar e executar
No terminal do VS Code, dentro de projeto_AC3:
```sh
npm ci
npm start
```
`npm ci` usa as versões registradas no package-lock.json. `npm install` também pode ser usado.
A instalação das dependências exige internet. Aguarde a mensagem de conexão e abra
**http://localhost:3000** no navegador DENTRO DA VM. Mantenha o terminal aberto.
Para encerrar, pressione Ctrl+C.
Não abra index.html diretamente e não use a extensão Live Server: a interface precisa do servidor Node.js.

## 5. Testar e apresentar evidências
1. Confira os dois registros de exemplo na lista.
2. Cadastre um aluno fictício, com nome, e-mail e curso. Confira a nova linha.
3. Clique em Editar, altere o curso e salve. Confira a alteração.
4. Atualize a página. O registro deve permanecer, pois está no MySQL.
5. Exclua o registro de teste e confirme sua remoção.
6. Tente enviar um e-mail inválido e campos vazios. O formulário deve impedir o cadastro.
7. No Workbench, execute `SELECT * FROM escola.alunos;` e compare com a interface.
8. Registre prints da VM, terminal, interface e consulta SQL para a apresentação e entrega.
Use dados fictícios. A aplicação é de laboratório, sem autenticação; execute em ambiente controlado.

## Arquivos e responsabilidades
| Arquivo | Função |
| --- | --- |
| server.js | API CRUD, validação, arquivos estáticos e conexão com MySQL |
| config.example.json | Modelo da configuração; copiar para config.json |
| script.sql | Banco, tabela, amostras e usuário de laboratório |
| public/index.html | Formulário e tabela |
| public/app.js | Requisições HTTP e interação com a interface |
| public/style.css | Aparência e adaptação a telas menores |
| package.json | Dependências e comando npm start |
| package-lock.json | Versões das dependências |

## Rotas para estudar
| Método | Endereço | Ação |
| --- | --- | --- |
| GET | /alunos | Lista alunos |
| POST | /alunos | Cadastra aluno |
| PUT | /alunos/:id | Atualiza aluno |
| DELETE | /alunos/:id | Exclui aluno |
POST e PUT recebem JSON com nome, email e curso. O servidor valida os dados,
usa parâmetros SQL e retorna 400 para dados inválidos, 404 para IDs não encontrados e 500 para falhas internas.

## Problemas frequentes
- **config.json não encontrado:** faça a cópia do arquivo de exemplo na pasta do servidor.
- **ER_ACCESS_DENIED_ERROR:** confira usuário/senha e a criação de cruduser no MySQL.
- **ECONNREFUSED:** inicie o serviço MySQL e confira host e porta.
- **ER_BAD_DB_ERROR / ER_NO_SUCH_TABLE:** execute script.sql e confira o nome do banco.
- **EADDRINUSE:** encerre outra instância do projeto ou altere appPort em config.json.
- **npm não reconhecido:** instale Node.js e reabra o VS Code.
- **PowerShell bloqueia npm.ps1:** selecione o terminal Command Prompt no VS Code ou execute npm.cmd ci e npm.cmd start.
- **Lista não carrega:** confira o terminal e abra a URL do Node.js, não um arquivo local.

## Revisão dos fontes recebidos
- Unificado server_local.js em server.js; configuração externa substitui IP e senhas fixos.
- Completada a pasta public, ausente nos anexos recebidos.
- Adicionadas validações, respostas para registros inexistentes e mensagens de erro.
- A aplicação só inicia após verificar banco e tabela.
- O script não repete as amostras ao ser executado novamente.
- Removida a dependência CORS, pois interface e API têm a mesma origem. O lockfile foi atualizado.
- Mantido o cadastro de alunos dos fontes originais. O tema não foi convertido para clientes.

## Verificação desta revisão
A instalação das dependências foi concluída. A sintaxe dos JavaScripts foi verificada.
Testes HTTP com banco simulado passaram para arquivos estáticos, CRUD, campos inválidos,
IDs inválidos/inexistentes, JSON malformado e tratamento de erro do banco.
Também foi verificado que a inicialização sem config.json encerra com orientação ao aluno.
Não havia MySQL Server neste ambiente: o script SQL e a conexão real precisam ser validados
no laboratório com a sequência da seção 5. A interface não foi testada em um navegador nesta revisão.
