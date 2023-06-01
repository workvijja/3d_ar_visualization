import { defineConfig } from "vite";

export default defineConfig({
    // base: '/app/upload/',
    // build: {
    //     rollupOptions: {
    //         input: {
    //             app: '/app/upload/index.html'
    //         }
    //     }
    // },
    server: {
        open: '/app/upload/index.html'
    }
})