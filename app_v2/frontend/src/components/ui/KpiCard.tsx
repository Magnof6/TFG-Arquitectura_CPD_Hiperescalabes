//CSS para tarjetas de KPIs individuales, usadas dentro de KpiPanel
interface Props {
    title: string
    value: string | number | React.ReactNode
    unit?: string
}

export default function KpiCard({ title, value, unit }: Props) {
    return (
        <div
            style={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "0.5rem",
                padding: "1rem",
            }}
        >
            <p
                style={{
                    margin: 0,
                    marginBottom: "0.5rem",
                    color: "#9ca3af",
                    fontSize: "0.85rem",
                }}
            >
                {title}
            </p>

            <p
                style={{
                    margin: 0,
                    fontSize: "1.4rem",
                    fontWeight: "bold",
                    color: "white",
                }}
            >
                {value}
                {unit && (
                    <span
                        style={{
                            marginLeft: "0.25rem",
                            fontSize: "0.9rem",
                            color: "#9ca3af",
                        }}
                    >
                        {unit}
                    </span>
                )}
            </p>
        </div>
    )
}