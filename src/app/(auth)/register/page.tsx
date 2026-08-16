import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Register | CrediBridge",
  description: "Create your CrediBridge account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="container relative min-h-[calc(100vh-4rem)] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px] py-10">
        <RegisterForm defaultRole={params.role} />
      </div>
    </div>
  );
}
