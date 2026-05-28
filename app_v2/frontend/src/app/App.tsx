import { BrowserRouter, Routes, Route, Link } from "react-router-dom"

import ScenariosPage from "../pages/scenarios/ScenariosPage"
import {ScenarioEditorPage} from "../pages/scenarios/ScenarioEditorPage"
import ComparisonPage from "../pages/comparison/ComparisonPage"

export default function App() {
    return (
        <BrowserRouter>
            <nav className="main-nav">
                <Link to="/">Simulación</Link>
                <Link to="/comparison">Comparador</Link>
                <Link to="/scenario-editor">Editor de escenarios</Link>
            </nav>

            <Routes>
                <Route path="/" element={<ScenariosPage />} />
                <Route path="/comparison" element={<ComparisonPage />} />
                <Route path="/scenario-editor" element={<ScenarioEditorPage />} />
            </Routes>
        </BrowserRouter>
    )
}