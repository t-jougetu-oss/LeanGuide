import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female"]);

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

// ユーザー
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  password: text("password"), // メール+パスワード認証用（ハッシュ済み）
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// プロフィール（身体情報）
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  gender: genderEnum("gender").notNull(),
  age: integer("age").notNull(),
  birthDate: date("birth_date"), // 生年月日（年齢の真実の値・自動加齢用）
  heightCm: numeric("height_cm").notNull(),
  weightKg: numeric("weight_kg").notNull(),
  bodyFatPercent: numeric("body_fat_percent"), // 体脂肪率
  activityLevel: activityLevelEnum("activity_level").notNull(),
  bmr: numeric("bmr"), // 基礎代謝（自動算出）
  tdee: numeric("tdee"), // 総消費カロリー（自動算出）
  proteinPercent: integer("protein_percent"), // PFCバランス（%）
  fatPercent: integer("fat_percent"),
  carbPercent: integer("carb_percent"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 目標設定
export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  targetWeightKg: numeric("target_weight_kg").notNull(),
  targetBodyFatPercent: numeric("target_body_fat_percent"), // 目標体脂肪率
  targetDate: date("target_date").notNull(),
  startDate: date("start_date"), // 開始日
  dailyCalorieTarget: integer("daily_calorie_target"), // 自動算出
  proteinPercent: integer("protein_percent"), // PFCバランス（%）
  fatPercent: integer("fat_percent"),
  carbPercent: integer("carb_percent"),
  proteinGrams: integer("protein_grams"), // 目標PFC（g）
  fatGrams: integer("fat_grams"),
  carbGrams: integer("carb_grams"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 体重記録
export const weightLogs = pgTable("weight_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  weightKg: numeric("weight_kg").notNull(),
  bodyFatPercent: numeric("body_fat_percent"), // 体脂肪率
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 食事記録
export const mealLogs = pgTable("meal_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  description: text("description").notNull(),
  photoUrl: text("photo_url"),
  // 分量調整後の値（表示・合計計算に使う実測値）
  calories: integer("calories"),
  proteinGrams: integer("protein_grams"),
  fatGrams: integer("fat_grams"),
  carbGrams: integer("carb_grams"),
  // 基準量（100%時）の値。編集時にスライダーを復元するために保存
  basePortion: text("base_portion"), // 例: "100g", "1人前"
  portionPercent: integer("portion_percent"), // 記録時のスライダー値（10〜200）
  baseCalories: integer("base_calories"),
  baseProteinGrams: integer("base_protein_grams"),
  baseFatGrams: integer("base_fat_grams"),
  baseCarbGrams: integer("base_carb_grams"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 活動記録
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  activityType: text("activity_type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  caloriesBurned: integer("calories_burned"),
  memo: text("memo"), // 詳細メモ
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// お気に入り（食事）
export const mealFavorites = pgTable("meal_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  calories: integer("calories"),
  proteinGrams: integer("protein_grams"),
  fatGrams: integer("fat_grams"),
  carbGrams: integer("carb_grams"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// お気に入り（運動）
export const activityFavorites = pgTable("activity_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes"),
  caloriesBurned: integer("calories_burned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// アプリ設定
export const appSettings = pgTable("app_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  pfcDecimalEnabled: boolean("pfc_decimal_enabled").default(false),
  heightUnit: text("height_unit").default("cm"), // cm or ft
  weightUnit: text("weight_unit").default("kg"), // kg or lb
  homeCardType: text("home_card_type").default("toggle"), // toggle or fixed
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
