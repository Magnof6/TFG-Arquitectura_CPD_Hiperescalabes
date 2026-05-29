interface Props {
    scenarioName: string
    setScenarioName: (value: string) => void
    scenarioDescription: string
    setScenarioDescription: (value: string) => void
    message: string | null
    error: string | null
    onCreateScenario: () => void
}

export default function CustomScenarioForm({
    scenarioName,
    setScenarioName,
    scenarioDescription,
    setScenarioDescription,
    message,
    error,
    onCreateScenario,
}: Props) {
    return (
        <section className="card">
            <h1>Editor de escenarios</h1>

            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}

            <div className="form-grid">
                <label>
                    ID / nombre del escenario
                    <input
                        value={scenarioName}
                        onChange={(event) =>
                            setScenarioName(event.target.value)
                        }
                    />
                </label>

                <label>
                    Descripción del escenario
                    <input
                        value={scenarioDescription}
                        onChange={(event) =>
                            setScenarioDescription(event.target.value)
                        }
                    />
                </label>
            </div>

            <button type="button" onClick={onCreateScenario}>
                Crear escenario custom
            </button>
        </section>
    )
}