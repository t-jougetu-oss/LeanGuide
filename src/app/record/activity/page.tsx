import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ActivityForm } from "./activity-form";

export default async function ActivityRecordPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">活動を記録</h1>
        <ActivityForm />
      </div>
    </div>
  );
}
