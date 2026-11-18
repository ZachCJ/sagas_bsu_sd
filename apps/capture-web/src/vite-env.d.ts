//Overall this file adds Tyepscript types for Vite envirment variables so Mapbox token
//Will be recognized as a string.

//Tells Typescript to include Vites client side type definitions.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  //Says property exists and is a string and your code should reassign it.
  readonly VITE_MAPBOX_TOKEN: string;
  //Set to "false" to load story map data from capture-api instead of the dummy files. See src/api/mapApi.ts.
  readonly VITE_USE_MOCK_DATA?: string;
}
