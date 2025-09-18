import { AuthButton } from "@/components/auth-button";
import { Logo } from "@/components/logo";
import { FoodsProvider } from "@/lib/contexts/FoodsContext";
import { UserProvider } from "@/lib/contexts/UserContext";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <FoodsProvider>
        <main className="min-h-screen flex flex-col items-center">
          <div className="flex-1 w-full flex flex-col gap-20 items-center">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
              <div className="w-full max-w-5xl flex justify-between items-center p-3 px-3 md:px-5 text-sm">
                <div className="flex gap-5 items-center font-semibold">
                  <Logo />
                </div>
                <AuthButton />
              </div>
            </nav>
            <div className="flex-1 flex flex-col gap-20 w-full max-w-5xl p-3 md:p-5">
              {children}
            </div>
          </div>
        </main>
      </FoodsProvider>
    </UserProvider>
  );
}
