// server.js

import http from 'http';
import express from 'express';
import injectSocketIO from './build/socketIoHandler.js';
import { handler } from './build/handler.js';
import cors from "cors"

const app = express();
const server = http.createServer(app);
app.use(cors({

}))
// Inject SocketIO
injectSocketIO(server);

// SvelteKit handlers
app.use(handler);

server.listen(9350, () => {
    console.log('Running on http://localhost:9350');
});