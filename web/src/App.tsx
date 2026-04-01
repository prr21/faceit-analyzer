import { HashRouter } from "react-router-dom"
import { AppRoutes } from "./routing"
import { StoreProvider } from "./store"

export function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  )
}
