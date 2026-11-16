import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import { createContext, type ReactElement } from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("Flamee opens the mood overview and each main tab supplies its title with the inbox action", () => {
  const source = ts.transpileModule(readFileSync(resolve("app/(main)/_layout.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const destinations: string[] = [];
  let tab = "index";
  const Tabs = Object.assign(() => null, { Screen: () => null });
  const NotificationBell = () => null;
  const module = { exports: {} as { default: () => ReactElement<any> } };
  const load = (id: string): unknown => {
    if (id === "react/jsx-runtime") return require(id);
    if (id === "expo-router") return { Tabs, useRouter: () => ({ navigate: (route: string) => destinations.push(route) }), useSegments: () => ["(main)", tab] };
    if (id === "tamagui") return { Text: "text", XStack: "row" };
    if (id.endsWith("/shared/components")) return { BottomNavigationBar: "nav", BottomNavigationIcon: "icon" };
    if (id.endsWith("/localization/messages")) return { getMessage: (_locale: string, key: string) => key };
    if (id.endsWith("/features/startup")) return { flameeSymbolAsset: 1 };
    if (id.endsWith("/features/main-navigation")) return { ProfileNavigationIcon: "avatar" };
    if (id.endsWith("/features/conversations")) return { NotificationBell };
    if (id.endsWith("/mainScreenHeaderContext")) return { MainScreenHeaderContext: createContext(null) };
    throw new Error(`Unexpected layout dependency: ${id}`);
  };
  new Function("require", "module", "exports", source)(load, module, module.exports);
  for (const [name, title] of [["index", "timelineFeed"], ["memories", "timelineMemories"], ["moments", "moodPreviewTitle"], ["tasks", "tasksTitle"], ["profile", "profileMenuTitle"]]) {
    tab = name;
    const layout = module.exports.default();
    const header = layout.props.value;
    assert.equal(header.props.children[0].props.children, title);
    assert.equal(header.props.children[1].type, NotificationBell);
    const bar = layout.props.children.props.tabBar({});
    const moodScreen = layout.props.children.props.children.find((screen: ReactElement<any>) => screen.props.name === "moments");
    assert.notEqual(moodScreen.props.options.href, null, "Expo Router redirects hidden tabs away from the overview");
    assert.equal(bar.props.fabAccessibilityLabel, "moodPreviewTitle");
    bar.props.onFabPress();
  }
  assert.deepEqual(destinations, Array(5).fill("/(main)/moments"));
});
