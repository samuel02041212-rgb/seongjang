import { LandingMain } from "@/components/landing/landing-main";
import { LandingHeader } from "@/components/shell/landing-header";
import { auth } from "@/lib/server-auth";

export default async function Home() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <div className="relative min-h-full bg-bg">
      <LandingHeader loggedIn={loggedIn} />
      <LandingMain />
    </div>
  );
}
