type AnalysisResult = {
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  action: string;
  priority: number; // 低い数字ほど高優先
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

type ActivityData = {
  totalMinutes: number;
  totalCaloriesBurned: number;
};

type Goal = {
  dailyCalorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  targetWeightKg: number;
};

export function analyzeWeeklyData(
  dailyData: DailyData[],
  goal: Goal,
  activity?: ActivityData,
  tdee?: number
): AnalysisResult[] {
  const allResults: AnalysisResult[] = [];

  // データ不足チェック
  if (dailyData.length < 3) {
    return [
      {
        type: "info",
        title: "データ収集中",
        description: `あと${7 - dailyData.length}日分のデータで分析を開始できます。毎日の記録が正確な分析の鍵です。`,
        action: "毎日の食事・体重を記録し続けましょう",
        priority: 0,
      },
    ];
  }

  const daysWithCalories = dailyData.filter((d) => d.calories > 0);
  const daysWithWeight = dailyData.filter((d) => d.weight !== null);

  // ===== 分析1: カロリー収支のズレ（優先度1） =====
  if (daysWithCalories.length > 0) {
    const avgCalories =
      daysWithCalories.reduce((sum, d) => sum + d.calories, 0) /
      daysWithCalories.length;
    const overRate =
      ((avgCalories - goal.dailyCalorieTarget) / goal.dailyCalorieTarget) * 100;
    const diff = Math.round(avgCalories - goal.dailyCalorieTarget);

    if (overRate > 15) {
      allResults.push({
        type: "warning",
        title: "カロリー摂取が目標を大きく超過",
        description: `この1週間の平均摂取カロリーは${Math.round(avgCalories)}kcalで、目標の${goal.dailyCalorieTarget}kcalを約${Math.round(overRate)}%上回っています。1日あたり${diff}kcal程度の調整で目標圏内に入ります。`,
        action: "間食を1回減らすか、主食の量を1割減らしてみましょう",
        priority: 1,
      });
    } else if (overRate > 5) {
      allResults.push({
        type: "warning",
        title: "カロリーがやや超過気味",
        description: `平均${Math.round(avgCalories)}kcal（目標比+${Math.round(overRate)}%）。わずかな超過ですが、毎日の積み重ねは大きな差になります。`,
        action: "飲み物や調味料のカロリーも見直してみましょう",
        priority: 1,
      });
    } else if (overRate < -20) {
      allResults.push({
        type: "warning",
        title: "カロリー不足に注意",
        description: `平均${Math.round(avgCalories)}kcal（目標比${Math.round(overRate)}%）。極端な制限は基礎代謝の低下を招き、逆に痩せにくくなる可能性があります。`,
        action: "目標カロリーに近づけましょう。1日1200kcal未満は避けてください",
        priority: 1,
      });
    } else {
      allResults.push({
        type: "success",
        title: "カロリー管理が順調です",
        description: `平均${Math.round(avgCalories)}kcal（目標${goal.dailyCalorieTarget}kcal）。理想的な範囲で管理できています。`,
        action: "この調子を維持しましょう",
        priority: 10,
      });
    }
  }

  // ===== 分析2: 平日/週末の摂取パターン差異（優先度2） =====
  if (daysWithCalories.length >= 5) {
    const weekdays = daysWithCalories.filter((d) => !d.isWeekend);
    const weekends = daysWithCalories.filter((d) => d.isWeekend);

    if (weekdays.length > 0 && weekends.length > 0) {
      const avgWeekday =
        weekdays.reduce((sum, d) => sum + d.calories, 0) / weekdays.length;
      const avgWeekend =
        weekends.reduce((sum, d) => sum + d.calories, 0) / weekends.length;

      if (avgWeekend > avgWeekday * 1.2) {
        const excessPercent = Math.round(
          ((avgWeekend - avgWeekday) / avgWeekday) * 100
        );
        allResults.push({
          type: "warning",
          title: "週末にカロリーが増加する傾向",
          description: `平日の摂取カロリーは目標内ですが、週末は平均${Math.round(avgWeekend - avgWeekday)}kcal多くなっています（+${excessPercent}%）。週末の2日間の超過が、平日5日分の努力を相殺している可能性があります。`,
          action: "週末の外食を1回減らすか、週末も1食は自炊してみましょう",
          priority: 2,
        });
      }
    }
  }

  // ===== 分析3: 脂質比率の偏り（優先度3） =====
  if (daysWithCalories.length > 0) {
    const avgFat =
      daysWithCalories.reduce((sum, d) => sum + d.fat, 0) /
      daysWithCalories.length;

    if (avgFat > goal.fatGrams * 1.3) {
      const fatCalPercent = Math.round(
        ((avgFat * 9) /
          (daysWithCalories.reduce((sum, d) => sum + d.calories, 0) /
            daysWithCalories.length)) *
          100
      );
      allResults.push({
        type: "warning",
        title: "脂質の比率が高めです",
        description: `平均${Math.round(avgFat)}g（目標${goal.fatGrams}g）。総カロリーのうち脂質が約${fatCalPercent}%を占めています。脂質は同じ重さでもカロリーが高いため、知らず知らずカロリーが増えやすくなります。`,
        action: "調理油を計量する、揚げ物を焼き・蒸しに変えてみましょう",
        priority: 3,
      });
    } else if (avgFat <= goal.fatGrams * 1.1 && avgFat >= goal.fatGrams * 0.7) {
      allResults.push({
        type: "success",
        title: "脂質のコントロールができています",
        description: `平均${Math.round(avgFat)}g（目標${goal.fatGrams}g）。適切な範囲です。`,
        action: "この調子で続けましょう",
        priority: 11,
      });
    }
  }

  // ===== 分析4: たんぱく質不足（優先度4） =====
  if (daysWithCalories.length > 0) {
    const avgProtein =
      daysWithCalories.reduce((sum, d) => sum + d.protein, 0) /
      daysWithCalories.length;

    if (avgProtein < goal.proteinGrams * 0.7) {
      allResults.push({
        type: "warning",
        title: "タンパク質が不足しています",
        description: `平均${Math.round(avgProtein)}g（目標${goal.proteinGrams}g）。タンパク質が不足すると、筋肉量が落ちやすくなり、基礎代謝の低下につながる可能性があります。`,
        action:
          "毎食に手のひら大のタンパク質食品を取り入れましょう（鶏むね肉、卵、豆腐など）",
        priority: 4,
      });
    } else if (avgProtein >= goal.proteinGrams * 0.9) {
      allResults.push({
        type: "success",
        title: "タンパク質が十分に摂れています",
        description: `平均${Math.round(avgProtein)}g（目標${goal.proteinGrams}g）。筋肉量の維持に良い状態です。`,
        action: "引き続きタンパク質を意識した食事を続けましょう",
        priority: 12,
      });
    }
  }

  // ===== 分析5: 活動量の見積もりズレ（優先度5） =====
  if (activity && tdee && activity.totalMinutes > 0) {
    // 1週間分のTDEE - BMR（活動で消費されるべきカロリー）
    // 簡易的に TDEE の活動部分 = TDEE * (1 - 1/activityMultiplier) ≈ TDEE * 0.2~0.5
    // ここでは7日間のTDEEの活動部分と実際の活動記録を比較
    const expectedWeeklyActivityCal = tdee * 7 * 0.25; // 活動部分を約25%と推定
    const actualWeeklyActivityCal = activity.totalCaloriesBurned;

    if (
      actualWeeklyActivityCal > 0 &&
      actualWeeklyActivityCal < expectedWeeklyActivityCal * 0.85
    ) {
      allResults.push({
        type: "warning",
        title: "活動量が設定より少ない可能性",
        description: `設定した活動レベルに対して、実際の活動記録がやや少ないようです。活動レベルの設定を見直すと、より正確な目標カロリーが算出できます。`,
        action:
          "設定で活動レベルを1段階下げて再計算するか、日常の歩行量を増やしてみましょう",
        priority: 5,
      });
    }
  }

  // ===== 分析6: 体重停滞の水分変動可能性（優先度6） =====
  if (daysWithWeight.length >= 3) {
    const weights = daysWithWeight.map((d) => d.weight!);
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);

    if (
      maxWeight - minWeight > 1.5 &&
      Math.abs(lastWeight - firstWeight) < 0.3
    ) {
      allResults.push({
        type: "info",
        title: "体重の変動は水分量の影響かもしれません",
        description: `この期間の変動幅: ${(maxWeight - minWeight).toFixed(1)}kg。食事と活動が目標通りに進んでいる場合、体重が動いていないように見えても、水分量の変動で体重は日々0.5〜1kg程度変わることがあります。`,
        action:
          "今の取り組みを維持しましょう。移動平均線を見て判断するのがおすすめです",
        priority: 6,
      });
    }
  }

  // 優先度順にソートし、warningは最大3件、successは残り枠に
  const warnings = allResults
    .filter((r) => r.type === "warning" || r.type === "info")
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  const successes = allResults
    .filter((r) => r.type === "success")
    .sort((a, b) => a.priority - b.priority);

  // warning/infoが3件未満なら、successで枠を埋める
  const remaining = 3 - warnings.length;
  const result = [...warnings, ...successes.slice(0, Math.max(remaining, 1))];

  return result.sort((a, b) => a.priority - b.priority);
}
