import type { ReactNode } from "react"

interface Props {
    title: string
    children: ReactNode
}

export default function SectionCard({
    title,
    children,
}: Props) {
    return (
        <section className="section-card">
            <h2 className="section-card-title">
                {title}
            </h2>

            {children}
        </section>
    )
}