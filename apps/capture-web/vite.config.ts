import react from "@vitejs/plugin-react";
//predefined function from vite, that helps Typescript and your editor understand and check the configuration
import { defineConfig, loadEnv } from "vite";

/**
 * The object inside holds actual settings for implementation of the project.
 * The proxy forwards browser requests beginning with /api to the Express server
 * on port 3001. mode is vites current configuration mode.
 */
export default defineConfig(({ mode }) => {
  //Reads enviorment variabiles from the root.
  const env = loadEnv(mode, "../..", "");

  //Returns vite configration for the app.
  return {
    //Tells vite its enviorment files are in reposiotry root.
    envDir: "../..",
    //Defines the VITE_MAPBOX_TOKEN environment variable for the app. without overwite or affecing anyone elses work..
    define: {
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(
        //?? replaces with  "" if the env variable is undefined.
        env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
      ),
    },

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
  };
});
