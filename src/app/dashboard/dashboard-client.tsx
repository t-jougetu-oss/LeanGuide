"use client";

import { useState, useEffect, useCallback } from "react";
import { DateNav } from "./date-nav";
import { HomeTabs } from "./home-tabs";
import { getDashboardData } from "./actions";

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

type InitialData = {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
  exerciseCalories: number;
  currentWeight: number | null;
  currentBodyFat: number | null;
};

export function DashboardClient({
  userId,
  goal,
  initialData,
  initialDate,
}: {
  userId: string;
  goal: GoalData | null;
  initialData: InitialData;
  initialDate: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(
    async (date: string) => {
      if (date === initialDate) {
        setData(initialData);
        return;
      }
      setLoading(true);
      const result = await getDashboardData(userId, date);
      setData(result);
      setLoading(false);
    },
    [userId, initialDate, initialData]
  );

  function handleDateChange(date: string) {
    setSelectedDate(date);
    fetchData(date);
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
    <div className={loading ? "opacity-50 transition-opacity" : ""}>
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
