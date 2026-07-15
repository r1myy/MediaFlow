export interface SimpleActionState {
  status: "idle" | "success" | "error";
  error?: string;
}

export const IDLE_STATE: SimpleActionState = { status: "idle" };

export interface LoginActionState {
  status: "idle" | "error" | "twoFactorRequired";
  error?: string;
  challengeId?: string;
}

export const LOGIN_IDLE_STATE: LoginActionState = { status: "idle" };
