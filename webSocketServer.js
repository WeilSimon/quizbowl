import injectSocketIO from './socketIoHandler.js';

export const webSocketServer = {
    name: 'webSocketServer',
    /**
     * @param {{ httpServer: any; }} server
     */
    configureServer(server) {
        injectSocketIO(server.httpServer);
    }
};
