interface Props {
    status: string
}

function getStatusStyles(status: string) {
    const normalizedStatus = status.toLowerCase()

    if (
        normalizedStatus.includes("activo") ||
        normalizedStatus.includes("operativo") ||
        normalizedStatus.includes("alimentado")
    ) {
        return {
            backgroundColor: "#064e3b",
            color: "#d1fae5",
        }
    }

    if (
        normalizedStatus.includes("degradado") ||
        normalizedStatus.includes("reserva")
    ) {
        return {
            backgroundColor: "#78350f",
            color: "#fef3c7",
        }
    }

    if (
        normalizedStatus.includes("fallado") ||
        normalizedStatus.includes("sin_alimentacion") ||
        normalizedStatus.includes("perdida")
    ) {
        return {
            backgroundColor: "#7f1d1d",
            color: "#fee2e2",
        }
    }

    return {
        backgroundColor: "#374151",
        color: "#f9fafb",
    }
}

export default function StatusBadge({ status }: Props) {
    const styles = getStatusStyles(status)

    return (
        <span
            style={{
                display: "inline-block",
                padding: "0.2rem 0.5rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                ...styles,
            }}
        >
            {status}
        </span>
    )
}