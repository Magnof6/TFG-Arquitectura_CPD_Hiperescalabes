import type { EventResponse } from "../../types/api";

export type RootCauseAnalysis = {
    firstDegradationEvent?: EventResponse;
    firstLoadLossSnapshot?: number;
    summary: string;
};