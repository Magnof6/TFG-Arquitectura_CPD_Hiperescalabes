import { BrowserRouter, Routes, Route, Link } from "react-router-dom"

import ScenariosPage from "../pages/scenarios/ScenariosPage"
import ComparisonPage from "../pages/comparison/ComparisonPage"

export default function App() {
    return (
        <BrowserRouter>
            <nav className="main-nav">
                <Link to="/">Simulación</Link>
                <Link to="/comparison">Comparador</Link>
            </nav>

            <Routes>
                <Route path="/" element={<ScenariosPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
            </Routes>
        </BrowserRouter>
    )
}