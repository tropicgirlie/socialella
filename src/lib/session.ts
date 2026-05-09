import { ADMIN_EMAIL, getCurrentUserEmail } from "@/lib/auth";

export type SoloSession = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

/**
 * Solo-user app: there's only ever one user. Middleware guards routes,
 * so by the time a server component calls this, the session cookie is
 * already validated. We still re-check here as a defense-in-depth.
 */
export async function getSession(): Promise<SoloSession> {
  const email = (await getCurrentUserEmail()) ?? ADMIN_EMAIL;
  return {
    user: {
      id: "solo",
      name: "Founder",
      email,
    },
  };
}
