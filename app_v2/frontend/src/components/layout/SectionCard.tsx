import type { ReactNode } from "react"

interface Props {
    title: string
    children: ReactNode
}

export default function SectionCard({ title, children }: Props) {
    return (
        <section
            style={{
                marginTop: "2rem",
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "0.75rem",
                padding: "1rem",
            }}
        >
            <h2
                style={{
                    marginTop: 0,
                    marginBottom: "1rem",
                }}
            >
                {title}
            </h2>

            {children}
        </section>
    )
}