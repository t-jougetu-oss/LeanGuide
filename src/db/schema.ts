import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  timestamp,
  pgEnum,
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
  googleId: text("google_id").unique().notNull(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
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
  heightCm: numeric("height_cm").notNull(),
  weightKg: numeric("weight_kg").notNull(),
  activityLevel: activityLevelEnum("activity_level").notNull(),
  bmr: numeric("bmr"), // 基礎代謝（自動算出）
  tdee: numeric("tdee"), // 総消費カロリー（自動算出）
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
  targetDate: date("target_date").notNull(),
  dailyCalorieTarget: integer("daily_calorie_target"), // 自動算出
  proteinGrams: integer("protein_grams"), // 目標PFC
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
  calories: integer("calories"),
  proteinGrams: integer("protein_grams"),
  fatGrams: integer("fat_grams"),
  carbGrams: integer("carb_grams"),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
