import type { SimulationResultResponse } from "../../types/api"

interface Props {
    result: SimulationResultResponse
}

function downloadFile(
    filename: string,
    content: string,
    mimeType: string
) {
    const BOM = "\uFEFF"

    const blob = new Blob([BOM + content], { type: mimeType })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()

    URL.revokeObjectURL(url)
}

function escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) {
        return ""
    }

    const stringValue = String(value)

    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {
        return `"${stringValue.replaceAll('"', '""')}"`
    }

    return stringValue
}

function convertToCsv(rows: Record<string, unknown>[]) {
    if (rows.length === 0) {
        return ""
    }

    const headers = Object.keys(rows[0])

    const csvRows = [
        headers.join(","),
        ...rows.map((row) =>
            headers.map((header) => escapeCsvValue(row[header])).join(",")
        ),
    ]

    return csvRows.join("\n")
}

export default function ExportMenu({ result }: Props) {
    function handleExportJson() {
        const content = JSON.stringify(result, null, 2)

        downloadFile(
            `${result.scenario_id}_result.json`,
            content,
            "application/json;charset=utf-8"
        )
    }

    function handleExportEventsCsv() {
        const csv = convertToCsv(
            result.events as unknown as Record<string, unknown>[]
        )

        downloadFile(
            `${result.scenario_id}_events.csv`,
            csv,
            "text/csv;charset=utf-8"
        )
    }

    function handleExportSnapshotsCsv() {
        const csv = convertToCsv(
            result.snapshots as unknown as Record<string, unknown>[]
        )

        downloadFile(
            `${result.scenario_id}_snapshots.csv`,
            csv,
            "text/csv;charset=utf-8"
        )
    }

    return (
        <section className="button-group">
            <button className="button button-secondary" onClick={handleExportJson}>
                Exportar resultado JSON
            </button>

            <button className="button button-secondary" onClick={handleExportEventsCsv}>
                Exportar eventos CSV
            </button>

            <button className="button button-secondary" onClick={handleExportSnapshotsCsv}>
                Exportar snapshots CSV
            </button>
        </section>
    )
}