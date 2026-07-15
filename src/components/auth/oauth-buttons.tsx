import { signInWithAppleAction, signInWithGoogleAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M16.36 1.02c.06 1.02-.35 2.02-.96 2.75-.65.77-1.7 1.36-2.72 1.28-.1-1 .4-2.05 1-2.7.68-.75 1.85-1.31 2.68-1.33ZM19.9 17.3c-.35.82-.77 1.6-1.28 2.31-.7.98-1.28 1.66-1.74 2.02-.7.6-1.46.9-2.27.92-.58.02-1.28-.16-2.1-.53a5.9 5.9 0 0 0-2.26-.52c-.78 0-1.5.18-2.28.52-.83.37-1.5.56-2.02.58-.78.03-1.55-.28-2.3-.94-.5-.4-1.1-1.12-1.83-2.15C.72 18.16 0 15.98 0 13.9c0-2.38.86-4.34 2.58-5.88a5.5 5.5 0 0 1 3.91-1.59c.86 0 1.87.28 3.02.85.83.42 1.4.63 1.72.63.24 0 .9-.24 1.97-.72 1.13-.5 2.08-.71 2.85-.63 2.1.17 3.68 1 4.73 2.5-1.88 1.14-2.81 2.73-2.79 4.77.02 1.6.6 2.93 1.75 3.98.49.47 1.03.83 1.63 1.09-.13.38-.27.75-.42 1.12Z" />
    </svg>
  );
}

export function OAuthButtons() {
  return (
    <div className="grid gap-2">
      <form action={signInWithGoogleAction}>
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon />
          Continue with Google
        </Button>
      </form>
      <form action={signInWithAppleAction}>
        <Button type="submit" variant="outline" className="w-full">
          <AppleIcon />
          Continue with Apple
        </Button>
      </form>
    </div>
  );
}
