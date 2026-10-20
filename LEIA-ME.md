# Desafio de Diagnóstico — SENAI-MG

Aplicativo multiplayer para navegadores. **Não precisa instalar nada nos computadores do SENAI**. É necessário publicar uma vez e configurar o Firebase. O aplicativo é independente e não é um produto oficial do SENAI.

## 1. Criar o Firebase

1. Entre em https://console.firebase.google.com/ com sua conta Google e crie um projeto.
2. Em **Build → Authentication → Sign-in method**, habilite **Anônimo** e **E-mail/senha**.
3. Em **Authentication → Users**, clique em **Adicionar usuário** e crie o e-mail e senha do apresentador. **Não coloque essa senha em nenhum arquivo do site.**
4. Em **Build → Realtime Database**, crie um banco (escolha uma região disponível). Em **Rules**, substitua todo o conteúdo pelo arquivo `database.rules.json` e clique em **Publicar**. NÃO use regras públicas de leitura/escrita.
5. No ícone de engrenagem → **Configurações do projeto → Seus apps**, cadastre um app Web `</>` e copie as configurações `firebaseConfig`. A `databaseURL` deve ser a URL EXATA do seu Realtime Database, que aparece na página do banco. Copie os valores para `firebase-config.js`.

## 2. Publicar pelo GitHub Pages (pode ser feito de casa)

1. No GitHub, crie um repositório **público** chamado `desafio-senai`.
2. Carregue os arquivos desta pasta na RAIZ do repositório (Upload files → Commit changes). Não publique senhas ou chaves privadas.
3. Entre em **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**, branch **main** e pasta **/(root)**. Salve.
4. Espere alguns minutos; o link deverá ter formato `https://SEU-USUARIO.github.io/desafio-senai/`.
5. Abra o link na rede do SENAI, entre em **SOU O APRESENTADOR** com o e-mail/senha cadastrados e crie uma sala.
6. Em outro computador ou celular, abra o mesmo endereço, entre com código e apelido. Faça uma rodada de teste e verifique o ranking.

## 3. Durante a apresentação

- O apresentador cria uma sala e projeta a página.
- Os visitantes digitam o código e um apelido, sem precisar de contas próprias.
- Cada pergunta dura 30 segundos. Quem acerta ganha 100 pontos (sem bônus por velocidade, para ser justo).
- O apresentador clica em **REVELAR RESPOSTA** e depois **PRÓXIMA QUESTÃO**.
- O ranking atualiza automaticamente. No fim, aparece o vencedor.
- Fechar a página do apresentador não apaga a sala. Basta abrir novamente, entrar e criar outra sala. A sala anterior não tem recuperação automática nesta versão.

## Observações e limites

- O acesso aos serviços Firebase (especialmente Realtime Database e Authentication) precisa ser permitido pela rede escolar; abrir a homepage do Firebase não comprova isso.
- Para o QR Code, é usado um serviço externo (api.qrserver.com). Se bloquear, use o código manual.
- Os jogadores não conseguem alterar a pontuação diretamente com as regras fornecidas, mas **as respostas certas estão no JavaScript público** e usuários avançados poderiam consultá-las. É uma atividade recreativa, não prova segura.
- O apresentador tem permissão de gerenciar as salas que criou. Qualquer outra conta e-mail/senha adicionada ao mesmo Firebase também poderá criar novas salas.
- O aplicativo não faz cobrança nem requer dados pessoais. Oriente visitantes a usar apenas apelidos, nunca nome completo.
- Hospedagem GitHub Pages é estática; sincronização e autenticação são feitas pelo Firebase. Os limites gratuitos dos serviços podem mudar.
- Teste a disponibilidade e estabilidade com a rede real antes do evento.
