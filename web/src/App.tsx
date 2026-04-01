import { HashRouter } from "react-router-dom"
import { AppRoutes } from "./routing"

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
