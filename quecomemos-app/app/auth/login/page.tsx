import { LoginForm } from "@/components/login-form";
import { PreventBackNavigation } from "@/components/prevent-back-navigation";

export default function Page() {
  return (
    <>
      <PreventBackNavigation />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
