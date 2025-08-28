# Guia de Prescrição Inteligente (GPI) - Versão Desktop (Electron + React)

Esta é a versão de desktop do Guia de Prescrição Inteligente, uma aplicação construída com Electron e React.

## Descrição

Um assistente de prescrição inteligente para estudantes de medicina e médicos, fornecendo modelos de prescrição baseados em evidências, informações detalhadas sobre medicamentos e ferramentas de apoio à decisão clínica alimentadas por IA.

## Como Funciona

Esta aplicação utiliza Electron para criar um wrapper de desktop em torno de uma aplicação web moderna feita com React e TypeScript. Ela não requer um passo de compilação (build) tradicional, pois utiliza o Babel Standalone para transpilar o código JSX/TSX diretamente no navegador (no processo de renderização do Electron).

### Pré-requisitos

- Node.js e `npm` (gerenciador de pacotes do Node.js)

### Instalação

1.  **Instalar Dependências:** Navegue até o diretório do projeto no seu terminal e execute o comando:
    ```bash
    npm install
    ```

### Configurar a Chave da API

A aplicação está configurada para buscar a chave da API do Google Gemini da variável de ambiente `process.env.API_KEY`. Para que o Electron tenha acesso a ela em um ambiente de desenvolvimento, você pode usar um pacote como `dotenv`.

1.  **Instale o `dotenv`:**
    ```bash
    npm install dotenv
    ```
2.  **Crie um arquivo `.env`:** Na raiz do projeto, crie um arquivo `.env` e adicione sua chave:
    ```
    API_KEY="SUA_CHAVE_API_DO_GEMINI_AQUI"
    ```
3.  **Atualize o `electron.js`:** Adicione `require('dotenv').config();` no topo do arquivo `electron.js`.

**Atenção:** Expor chaves de API em aplicações cliente não é uma prática segura para produção. Esta abordagem é adequada apenas para desenvolvimento ou uso pessoal.

## Executando a Aplicação

Para iniciar a aplicação, execute o comando:

```bash
npm start
```
Isso iniciará o processo do Electron, que abrirá uma janela e carregará a aplicação React.

## Empacotando para Distribuição

Para criar um executável para seu sistema operacional (ex: .exe para Windows, .dmg para macOS), use o comando:
```bash
npm run pack
```
Isso utilizará o `electron-builder` para gerar os arquivos de instalação no diretório `dist`.

## Estrutura do Projeto

-   `electron.js`: O processo principal do Electron.
-   `index.html`: O ponto de entrada HTML que carrega a aplicação React.
-   `index.tsx`: O ponto de entrada da aplicação React.
-   `package.json`: Define as dependências e scripts do Node.js/Electron.
-   `components/`: Componentes React.
-   `screens/`: Componentes de tela do React.
-   `services/`: Lógica de negócio e chamadas de API.