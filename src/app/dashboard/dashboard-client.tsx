"use client";

import { useRouter, usePathname } from "next/navigation";
import { DateNav } from "./date-nav";
import { HomeTabs } from "./home-tabs";
import { jstToday } from "@/lib/date";

type PfcItem = {
  label: string;
  fullLabel: string;
  current: number;
  target: number;
};

type GoalData = {
  dailyCalorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  targetWeightKg: number;
  targetBodyFatPercent: number | null;
};

type DayData = {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
  exerciseCalories: number;
  currentWeight: number | null;
  currentBodyFat: number | null;
};

export function DashboardClient({
  goal,
  data,
  selectedDate,
}: {
  goal: GoalData | null;
  data: DayData;
  selectedDate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleDateChange(date: string) {
    // 今日を選択した場合は ?date を消してクリーンなURLに
    if (date === jstToday()) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?date=${date}`);
    }
  }

  const pfcData: PfcItem[] = goal
    ? [
        {
          label: "P",
          fullLabel: "タンパク質",
          current: data.totalProtein,
          target: goal.proteinGrams,
        },
        {
          label: "F",
          fullLabel: "脂質",
          current: data.totalFat,
          target: goal.fatGrams,
        },
        {
          label: "C",
          fullLabel: "炭水化物",
          current: data.totalCarb,
          target: goal.carbGrams,
        },
      ]
    : [];

  return (
    <div>
      <DateNav selectedDate={selectedDate} onDateChange={handleDateChange} />
      <HomeTabs
        intake={data.totalCalories}
        calorieTarget={goal?.dailyCalorieTarget ?? 0}
        exerciseCalories={data.exerciseCalories}
        pfcData={pfcData}
        currentWeight={data.currentWeight}
        targetWeight={goal ? goal.targetWeightKg : null}
        currentBodyFat={data.currentBodyFat}
        targetBodyFat={goal?.targetBodyFatPercent ?? null}
        hasGoal={!!goal}
      />
    </div>
  );
}
