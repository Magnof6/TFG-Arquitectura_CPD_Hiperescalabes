interface Props {
    status: string
}

function getStatusClass(status: string) {
    const normalizedStatus = status.toLowerCase()

    if (
        normalizedStatus.includes("activo") ||
        normalizedStatus.includes("operativo") ||
        normalizedStatus.includes("alimentado")
    ) {
        return "status-badge--success"
    }

    if (
        normalizedStatus.includes("degradado") ||
        normalizedStatus.includes("reserva")
    ) {
        return "status-badge--warning"
    }

    if (
        normalizedStatus.includes("fallado") ||
        normalizedStatus.includes("sin_alimentacion") ||
        normalizedStatus.includes("perdida")
    ) {
        return "status-badge--danger"
    }

    return "status-badge--neutral"
}

export default function StatusBadge({ status }: Props) {
    return (
        <span
            className={`status-badge ${getStatusClass(status)}`}
        >
            {status}
        </span>
    )
}