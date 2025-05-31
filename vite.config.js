/* eslint-disable no-undef */
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
  proxy: {
    '/shorten': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      secure: false,
    },
    '/:shortId': {
      target: 'http://localhost:4000',
      changeOrigin: true,
      secure: false,
    },
  },
},

  rules: {
    "react/prop-types": 0,
  },
});
