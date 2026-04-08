// 基礎代謝（BMR）をミフリン・セントジョール式で計算
export function calcBMR(
  gender: "male" | "female",
  weightKg: number,
  heightCm: number,
  age: number
): number {
  if (gender === "male") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

// 活動レベルに応じた係数
const activityMultiplier = {
  sedentary: 1.2, // ほぼ運動しない
  light: 1.375, // 軽い運動（週1-3回）
  moderate: 1.55, // 中程度の運動（週3-5回）
  active: 1.725, // 激しい運動（週6-7回）
  very_active: 1.9, // 非常に激しい運動
} as const;

// 総消費カロリー（TDEE）を計算
export function calcTDEE(
  bmr: number,
  activityLevel: keyof typeof activityMultiplier
): number {
  return Math.round(bmr * activityMultiplier[activityLevel]);
}
