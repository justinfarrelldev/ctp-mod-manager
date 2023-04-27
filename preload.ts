const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // TODO refine these "any" data types down to their actual typing
  send: (channel, data) => {
    let validChannels = ['SEND_CTP2_INSTALL_DIR'];
    console.log('got a channel: ', channel, '| is it valid? ', validChannels.includes(channel));
    if (validChannels.includes(channel)) ipcRenderer.send(channel, data);
  },
  receive: (channel, data) => {
    let validChannels = ['RECEIVE_CTP2_INSTALL_DIR'];
    if (validChannels.includes(channel)) ipcRenderer.on(channel, data);
  },
});
