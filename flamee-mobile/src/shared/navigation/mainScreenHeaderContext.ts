import { createContext, type ReactNode } from "react";

/** The main layout supplies the title and real inbox action; screens place it in their scroll content. */
export const MainScreenHeaderContext = createContext<ReactNode>(null);
