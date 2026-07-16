export interface SimpleActionState {
  status: "idle" | "success" | "error";
  error?: string;
}

export const IDLE_STATE: SimpleActionState = { status: "idle" };
