import type { CatSettings } from "./catdraw";

export type CoatPreset = {
  id: string;
  name: string;
  s: CatSettings;
};

export const PRESETS: CoatPreset[] = [
  {
    id: "black",
    name: "Kuro",
    s: {
      baseColor: "#2d2a30",
      patternColor: "#4c4753",
      bellyColor: "#efe9e0",
      pattern: "solid",
    },
  },
  {
    id: "tabby",
    name: "Tabby",
    s: {
      baseColor: "#e6a15c",
      patternColor: "#9c5a23",
      bellyColor: "#fff3e2",
      pattern: "tabby",
    },
  },
  {
    id: "tuxedo",
    name: "Tuxedo",
    s: {
      baseColor: "#26242a",
      patternColor: "#3a3742",
      bellyColor: "#f6f1e8",
      pattern: "tuxedo",
    },
  },
  {
    id: "calico",
    name: "Calico",
    s: {
      baseColor: "#efe7da",
      patternColor: "#caa26e",
      bellyColor: "#ffffff",
      pattern: "calico",
    },
  },
  {
    id: "siamese",
    name: "Siamese",
    s: {
      baseColor: "#e7ddce",
      patternColor: "#5b4636",
      bellyColor: "#ffffff",
      pattern: "siamese",
    },
  },
];
