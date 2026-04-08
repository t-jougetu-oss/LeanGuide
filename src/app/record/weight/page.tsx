import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WeightForm } from "./weight-form";

export default async function WeightRecordPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">体重を記録</h1>
        <WeightForm />
      </div>
    </div>
  );
}
