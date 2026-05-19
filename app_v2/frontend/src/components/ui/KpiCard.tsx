interface Props {
    title: string
    value: string | number | React.ReactNode
    unit?: string
}

export default function KpiCard({
    title,
    value,
    unit,
}: Props) {
    return (
        <div className="kpi-card">
            <p className="kpi-card-title">
                {title}
            </p>

            <p className="kpi-card-value">
                {value}

                {unit && (
                    <span className="kpi-card-unit">
                        {unit}
                    </span>
                )}
            </p>
        </div>
    )
}