import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { webSocketServer } from './webSocketServer.js';

export default defineConfig({
	server: {
        port: 9357
    },
	plugins: [sveltekit(), webSocketServer]
});
