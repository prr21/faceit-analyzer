import { HashRouter } from "react-router-dom"
import { AppRoutes } from "./routing/routes"
import { StoreProvider } from "./providers"

export function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  )
}
