import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MealForm } from "./meal-form";

export default async function MealRecordPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">食事を記録</h1>
        <MealForm />
      </div>
    </div>
  );
}
