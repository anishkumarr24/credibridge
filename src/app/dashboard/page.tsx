import { redirect } from "next/navigation";
import { auth } from "@/../auth";

export default async function DashboardRedirect() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as string;
  
  if (role === "ADMIN") {
    redirect("/dashboard/admin");
  } else if (role === "LENDER") {
    redirect("/dashboard/lender");
  } else {
    redirect("/dashboard/worker");
  }
}
