import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login | CrediBridge",
  description: "Login to your CrediBridge account",
};

export default function LoginPage() {
  return (
    <div className="container relative min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px] py-10">
        <LoginForm />
      </div>
    </div>
  );
}
