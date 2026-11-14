export type DesignSystemComponentId =
  | "button"
  | "input"
  | "card"
  | "dialog"
  | "sheet"
  | "toast"
  | "switch"
  | "checkbox"
  | "slider";

export type DesignSystemCatalogEntry = {
  id: DesignSystemComponentId;
  title: string;
  implementation: string;
  importPath: "tamagui" | `src/shared/components/${string}`;
};

export const designSystemCatalog: readonly DesignSystemCatalogEntry[] = [
  {
    id: "button",
    title: "Button",
    implementation: "AppButton → Tamagui.Button",
    importPath: "src/shared/components/AppButton",
  },
  {
    id: "input",
    title: "Input",
    implementation: "AppField → Tamagui.Input / Tamagui.TextArea",
    importPath: "src/shared/components/AppField",
  },
  {
    id: "card",
    title: "Card",
    implementation: "SectionCard → Tamagui.Card",
    importPath: "src/shared/components/SectionCard",
  },
  {
    id: "dialog",
    title: "Dialog",
    implementation: "AppDialog → Tamagui.Dialog",
    importPath: "src/shared/components/AppDialog",
  },
  {
    id: "sheet",
    title: "Sheet",
    implementation: "AppSheet → Tamagui.Sheet",
    importPath: "src/shared/components/AppSheet",
  },
  {
    id: "toast",
    title: "Toast",
    implementation: "AppToast → Tamagui.Toast",
    importPath: "src/shared/components/AppToast",
  },
  {
    id: "switch",
    title: "Switch",
    implementation: "AppSwitch → Tamagui.Switch",
    importPath: "src/shared/components/AppSwitch",
  },
  {
    id: "checkbox",
    title: "Checkbox",
    implementation: "AppCheckbox → Tamagui.Checkbox",
    importPath: "src/shared/components/AppCheckbox",
  },
  {
    id: "slider",
    title: "Slider",
    implementation: "AppSlider → Tamagui.Slider",
    importPath: "src/shared/components/AppSlider",
  },
] as const;
