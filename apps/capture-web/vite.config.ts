import react from "@vitejs/plugin-react";
//predefined function from vite, that helps Typescript and your editor understand and check the configuration
import { defineConfig } from "vite";

/**
 * The object inside holds actual settings for implmentation of project
 * Tells vite how to run react frontend during devleoment.
 * proxy will forward browser request begining /api to express sever on port 3001
 */
export default defineConfig({
  //Enable react plugin.
  plugins: [react()],
  //For vites local development server.
  server: {
    //Runs frontend on port 3002, while backend express server runs on port 3001
    port: 3002,
    //Rules for forwarding certian requests from Vitess server to express server.
    // This is needed because of CORS policy, which prevents browser from making request
    //  to different port than the one it is running on.
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        //changes request header
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
