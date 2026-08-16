import { getWorkerProfile } from "@/actions/worker-profile";
import { ProfileForm } from "./profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function WorkerProfilePage() {
  const profile = await getWorkerProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Your Worker Profile</CardTitle>
          <CardDescription>
            Update your professional information and gig platform details to help us calculate a more accurate credit score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialData={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
