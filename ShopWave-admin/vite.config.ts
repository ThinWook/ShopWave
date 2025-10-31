import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.NEXT_PUBLIC_API_BASE_URL || env.VITE_API_BASE_URL || "https://localhost:5001";

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          // This will transform your SVG to a React component
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
    server: {
      host: "localhost",
      port: 4000,
      strictPort: true,
      proxy: {
        // Forward API calls to the backend to avoid CORS during development
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
          // Optionally remove the /api prefix if your backend doesn't expect it
          // rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    preview: {
      host: "localhost",
      port: 4000,
    },
  };
});
