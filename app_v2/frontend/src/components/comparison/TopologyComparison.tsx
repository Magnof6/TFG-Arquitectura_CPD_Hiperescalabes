import { useMemo, useState } from "react"

import type {
    SimulationResultResponse,
    SnapshotResponse,
} from "../../types/api"

import SectionCard from "../layout/SectionCard"
import TopologyGraph from "../charts/TopologyGraph"

interface Props {
    resultA: SimulationResultResponse
    resultB: SimulationResultResponse
}

function getAllSnapshotTimes(
    snapshotsA: SnapshotResponse[],
    snapshotsB: SnapshotResponse[]
) {
    return Array.from(
        new Set([
            ...snapshotsA.map((snapshot) => snapshot.tiempo_s),
            ...snapshotsB.map((snapshot) => snapshot.tiempo_s),
        ])
    ).sort((a, b) => a - b)
}

function findSnapshotByTime(
    snapshots: SnapshotResponse[],
    time: number
) {
    return snapshots.find((snapshot) => snapshot.tiempo_s === time) ?? null
}

export default function TopologyComparison({
    resultA,
    resultB,
}: Props) {
    const times = useMemo(
        () =>
            getAllSnapshotTimes(
                resultA.snapshots,
                resultB.snapshots
            ),
        [resultA.snapshots, resultB.snapshots]
    )

    const [selectedTimeIndex, setSelectedTimeIndex] =
        useState(times.length - 1)

    const selectedTime = times[selectedTimeIndex]

    const snapshotA = findSnapshotByTime(
        resultA.snapshots,
        selectedTime
    )

    const snapshotB = findSnapshotByTime(
        resultB.snapshots,
        selectedTime
    )

    if (times.length === 0) {
        return null
    }

    return (
        <SectionCard title="Topología comparada">
            <div className="form-panel topology-comparison-controls">
                <label>
                    Snapshot temporal comparado:{" "}
                    <strong>{selectedTime}s</strong>
                </label>

                <input
                    className="form-input"
                    type="range"
                    min={0}
                    max={times.length - 1}
                    value={selectedTimeIndex}
                    onChange={(event) =>
                        setSelectedTimeIndex(
                            Number(event.target.value)
                        )
                    }
                />
            </div>

            <div className="topology-comparison-grid">
                <div className="topology-comparison-panel">
                    <h3>Escenario A</h3>
                    <TopologyGraph
                        topology={resultA.topology}
                        snapshot={snapshotA}
                    />
                </div>

                <div className="topology-comparison-panel">
                    <h3>Escenario B</h3>
                    <TopologyGraph
                        topology={resultB.topology}
                        snapshot={snapshotB}
                    />
                </div>
            </div>
        </SectionCard>
    )
}