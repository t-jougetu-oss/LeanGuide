type AnalysisResult = {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  action: string;
};

type DailyData = {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carb: number;
  weight: number | null;
  isWeekend: boolean;
};

export function analyzeWeeklyData(
  dailyData: DailyData[],
  goal: {
    dailyCalorieTarget: number;
    proteinGrams: number;
    fatGrams: number;
    carbGrams: number;
    targetWeightKg: number;
  }
): AnalysisResult[] {
  const results: AnalysisResult[] = [];

  if (dailyData.length < 3) {
    results.push({
      type: "info",
      title: "データ収集中",
      description: `あと${7 - dailyData.length}日分のデータで分析を開始できます`,
      action: "毎日の食事・体重を記録し続けましょう",
    });
    return results;
  }

  const daysWithCalories = dailyData.filter((d) => d.calories > 0);
  const daysWithWeight = dailyData.filter((d) => d.weight !== null);

  // 1. カロリー超過チェック
  if (daysWithCalories.length > 0) {
    const avgCalories =
      daysWithCalories.reduce((sum, d) => sum + d.calories, 0) /
      daysWithCalories.length;
    const overRate =
      ((avgCalories - goal.dailyCalorieTarget) / goal.dailyCalorieTarget) * 100;

    if (overRate > 15) {
      results.push({
        type: "warning",
        title: "カロリー摂取が目標を大きく超過",
        description: `平均${Math.round(avgCalories)}kcal（目標比+${Math.round(overRate)}%）`,
        action: "間食を減らすか、1食あたりの量を見直してみましょう",
      });
    } else if (overRate > 5) {
      results.push({
        type: "warning",
        title: "カロリーがやや超過気味",
        description: `平均${Math.round(avgCalories)}kcal（目標比+${Math.round(overRate)}%）`,
        action: "飲み物や調味料のカロリーも見直してみましょう",
      });
    } else if (overRate < -20) {
      results.push({
        type: "warning",
        title: "カロリー不足に注意",
        description: `平均${Math.round(avgCalories)}kcal（目標比${Math.round(overRate)}%）`,
        action: "極端な制限は代謝低下の原因に。目標カロリーに近づけましょう",
      });
    } else {
      results.push({
        type: "success",
        title: "カロリー管理が順調",
        description: `平均${Math.round(avgCalories)}kcal（目標${goal.dailyCalorieTarget}kcal）`,
        action: "この調子を維持しましょう",
      });
    }
  }

  // 2. PFCバランスの偏り検出
  if (daysWithCalories.length > 0) {
    const avgProtein =
      daysWithCalories.reduce((sum, d) => sum + d.protein, 0) /
      daysWithCalories.length;
    const avgFat =
      daysWithCalories.reduce((sum, d) => sum + d.fat, 0) /
      daysWithCalories.length;

    if (avgProtein < goal.proteinGrams * 0.7) {
      results.push({
        type: "warning",
        title: "タンパク質が不足しています",
        description: `平均${Math.round(avgProtein)}g（目標${goal.proteinGrams}g）`,
        action: "鶏むね肉、卵、豆腐などを意識的に取り入れましょう",
      });
    }

    if (avgFat > goal.fatGrams * 1.3) {
      results.push({
        type: "warning",
        title: "脂質の比率が高めです",
        description: `平均${Math.round(avgFat)}g（目標${goal.fatGrams}g）`,
        action: "揚げ物を焼き・蒸しに変える、ドレッシングを控えめに",
      });
    }
  }

  // 3. 平日/週末の摂取パターン差異
  if (daysWithCalories.length >= 5) {
    const weekdays = daysWithCalories.filter((d) => !d.isWeekend);
    const weekends = daysWithCalories.filter((d) => d.isWeekend);

    if (weekdays.length > 0 && weekends.length > 0) {
      const avgWeekday =
        weekdays.reduce((sum, d) => sum + d.calories, 0) / weekdays.length;
      const avgWeekend =
        weekends.reduce((sum, d) => sum + d.calories, 0) / weekends.length;

      if (avgWeekend > avgWeekday * 1.2) {
        results.push({
          type: "warning",
          title: "週末にカロリーが増加する傾向",
          description: `平日平均${Math.round(avgWeekday)}kcal → 週末平均${Math.round(avgWeekend)}kcal`,
          action:
            "週末の外食や間食を意識してみましょう。平日の貯金が帳消しになっている可能性があります",
        });
      }
    }
  }

  // 4. 体重停滞の水分変動可能性
  if (daysWithWeight.length >= 3) {
    const weights = daysWithWeight.map((d) => d.weight!);
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);

    if (maxWeight - minWeight > 1.5 && Math.abs(lastWeight - firstWeight) < 0.3) {
      results.push({
        type: "info",
        title: "体重の変動は水分量の影響かもしれません",
        description: `この期間の変動幅: ${(maxWeight - minWeight).toFixed(1)}kg`,
        action:
          "1〜2kgの日内変動は正常です。7日間の移動平均で傾向を見ましょう",
      });
    }
  }

  return results;
}
