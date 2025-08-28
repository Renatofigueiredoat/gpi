
// electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Cria a janela do navegador.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // É uma boa prática de segurança manter essas configurações.
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'build/icon.png')
  });

  // Carrega o arquivo index.html principal que por sua vez
  // carrega a aplicação React.
  mainWindow.loadFile('index.html');


  // Você pode abrir o DevTools (ferramentas de desenvolvedor) para depuração.
  // mainWindow.webContents.openDevTools();
}

// Este método será chamado quando o Electron terminar a
// inicialização e estiver pronto para criar janelas do navegador.
// Algumas APIs só podem ser usadas após a ocorrência deste evento.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // No macOS, é comum recriar uma janela no aplicativo quando o
    // ícone da dock é clicado e não há outras janelas abertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Encerra quando todas as janelas são fechadas, exceto no macOS. Lá, é comum
// para aplicativos e sua barra de menu permanecerem ativos até que o usuário saia
// explicitamente com Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});