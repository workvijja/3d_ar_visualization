import { defineConfig } from "vite";

export default defineConfig({
    // base: '/app/main/index.html',
    build: {
        rollupOptions: {
            input: {
                app: '/app/main/'
            }
        }
    },
    // server: {
    //     open: '/app/main/index.html'
    // }
})