"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveMeal } from "./actions";
import { DateInput } from "../../components/date-input";

function PfcSlider({
  label,
  value,
  adjustedValue,
  max,
  onChange,
  hiddenName,
}: {
  label: string;
  value: string;
  adjustedValue: number;
  max: number;
  onChange: (v: string) => void;
  hiddenName: string;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function finishEditing() {
    setEditing(false);
    const num = Number(value);
    if (isNaN(num) || num < 0) onChange("0");
    else if (num > max) onChange(String(max));
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min="0"
            max={max}
            step="0.1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => e.key === "Enter" && finishEditing()}
            className="w-16 rounded-md border border-zinc-300 px-2 py-1 text-sm text-center dark:border-zinc-700 dark:bg-zinc-900"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="w-16 rounded-md border border-dashed border-zinc-300 px-2 py-1 text-sm text-center hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800 transition-colors"
            title="タップして直接入力"
          >
            {adjustedValue}
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange(String(Math.max(0, Number(value) - 1)))}
          className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 dark:border-zinc-700"
        >
          -
        </button>
        <input
          type="range"
          min="0"
          max={max}
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-zinc-900 dark:accent-white"
        />
        <button
          type="button"
          onClick={() => onChange(String(Math.min(max, Number(value) + 1)))}
          className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 dark:border-zinc-700"
        >
          +
        </button>
      </div>
      <input type="hidden" name={hiddenName} value={adjustedValue} />
    </div>
  );
}

const mealTypes = [
  { value: "meal", label: "食事" },
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "間食" },
] as const;

type Favorite = {
  id: string;
  name: string;
  calories: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
  carbGrams: number | null;
};

type Tab = "search" | "direct" | "favorites";

export function MealForm({ favorites = [] }: { favorites?: Favorite[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("direct");
  const [addToFavorite, setAddToFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; kcal: number; protein: number; fat: number; carb: number }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favSearch, setFavSearch] = useState("");

  // 直接入力フィールド
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [mealType, setMealType] = useState("meal");
  const [protein, setProtein] = useState("0");
  const [fat, setFat] = useState("0");
  const [carb, setCarb] = useState("0");
  const [basePortion, setBasePortion] = useState("");
  const [portion, setPortion] = useState("100");
  const [isFromFavorite, setIsFromFavorite] = useState(false);

  const resetForm = useCallback(() => {
    setFoodName("");
    setCalories("");
    setProtein("0");
    setFat("0");
    setCarb("0");
    setBasePortion("");
    setPortion("100");
    setAddToFavorite(false);
    setIsFromFavorite(false);
  }, []);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const result = await saveMeal(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.refresh();
      setSaving(false);
      resetForm();
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearched(true);
    const res = await fetch(`/api/foods?q=${encodeURIComponent(searchQuery.trim())}`);
    const data = await res.json();
    setSearchResults(data);
    setSearching(false);
  }

  function applySearchResult(item: { name: string; kcal: number; protein: number; fat: number; carb: number }) {
    setFoodName(item.name);
    setCalories(String(item.kcal));
    setProtein(String(item.protein));
    setFat(String(item.fat));
    setCarb(String(item.carb));
    setBasePortion("100g");
    setPortion("100");
    setIsFromFavorite(false);
    setTab("direct");
  }

  function applyFavorite(fav: Favorite) {
    setFoodName(fav.name);
    if (fav.calories) setCalories(String(fav.calories));
    if (fav.proteinGrams) setProtein(String(fav.proteinGrams));
    if (fav.fatGrams) setFat(String(fav.fatGrams));
    if (fav.carbGrams) setCarb(String(fav.carbGrams));
    setBasePortion("1人前");
    setPortion("100");
    setIsFromFavorite(true);
    setTab("direct");
  }

  const filteredFavorites = favSearch
    ? favorites.filter((f) =>
        f.name.toLowerCase().includes(favSearch.toLowerCase())
      )
    : favorites;

  // 分量に応じた値の計算
  const portionRatio = Number(portion) / 100;
  const adjustedCalories = calories
    ? Math.round(Number(calories) * portionRatio)
    : 0;
  const adjustedProtein = Math.round(Number(protein) * portionRatio * 10) / 10;
  const adjustedFat = Math.round(Number(fat) * portionRatio * 10) / 10;
  const adjustedCarb = Math.round(Number(carb) * portionRatio * 10) / 10;

  return (
    <div className="flex flex-col gap-5">
      {/* タブ */}
      <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
        {(["search", "direct", "favorites"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {t === "search" ? "検索入力" : t === "direct" ? "直接入力" : "お気に入り"}
          </button>
        ))}
      </div>

      {/* 検索タブ */}
      {tab === "search" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="検索文字を入力する"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
            >
              {searching ? "..." : "検索"}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            ※文部科学省「日本食品標準成分表」のデータです（100gあたり）。
            <br />
            スペース区切りで複数キーワード検索できます。
          </p>

          {searchResults.length > 0 ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 max-h-80 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applySearchResult(item)}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {item.kcal}kcal / P:{item.protein}g F:{item.fat}g C:{item.carb}g
                  </p>
                </button>
              ))}
            </div>
          ) : searched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3 text-zinc-300">&#128269;</div>
              <p className="text-sm font-medium text-zinc-500 mb-2">
                検索結果がありません
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                検索したい食材や食品名を入力してください。
                <br />
                ひらがな、カタカナ、漢字はそれぞれ正確な表記で検索す
                <br />
                ると検索結果がヒットしやすくなります。
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3 text-zinc-300">&#128269;</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                検索したい食材や食品名を入力してください。
              </p>
            </div>
          )}
        </div>
      )}

      {/* お気に入りタブ */}
      {tab === "favorites" && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={favSearch}
            onChange={(e) => setFavSearch(e.target.value)}
            placeholder="検索文字を入力する"
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {filteredFavorites.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">
              お気に入りがまだありません。
              <br />
              記録時に「お気に入りに追加」をオンにすると登録されます。
            </p>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredFavorites.map((fav) => (
                <button
                  key={fav.id}
                  type="button"
                  onClick={() => applyFavorite(fav)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm">{fav.name}</span>
                  {fav.calories && (
                    <span className="text-xs text-zinc-400">
                      {fav.calories}kcal
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 直接入力タブ */}
      {tab === "direct" && (
        <form action={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">食品名</span>
            <input
              type="text"
              name="description"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="例：ご飯、味噌汁、焼き魚"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">カロリー</span>
            <input
              type="number"
              name="calories"
              min="0"
              step="0.1"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="0"
            />
          </label>

          {/* 種類 */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">種類</span>
            <div className="flex gap-2 flex-wrap">
              {mealTypes.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMealType(value)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    mealType === value
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input type="hidden" name="mealType" value={mealType} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">日付</span>
            <DateInput
              name="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* PFC スライダー */}
          <PfcSlider
            label="P (タンパク質)"
            value={protein}
            adjustedValue={adjustedProtein}
            max={200}
            onChange={setProtein}
            hiddenName="proteinGrams"
          />
          <PfcSlider
            label="F (脂質)"
            value={fat}
            adjustedValue={adjustedFat}
            max={200}
            onChange={setFat}
            hiddenName="fatGrams"
          />
          <PfcSlider
            label="C (炭水化物)"
            value={carb}
            adjustedValue={adjustedCarb}
            max={500}
            onChange={setCarb}
            hiddenName="carbGrams"
          />

          {/* 基準量・分量 */}
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50 flex flex-col gap-4">
            <p className="text-xs text-zinc-400">
              {isFromFavorite
                ? "お気に入りの登録量に対して、実際に食べた割合を入力してください"
                : "普段の量を基準量に入力し、今回食べた割合を分量に入力してください"}
            </p>

            {/* 基準量 */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                基準量
                <span className="text-xs text-zinc-400 ml-1">
                  （例: 100g、1人前、1個）
                </span>
              </span>
              {isFromFavorite ? (
                <p className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 text-zinc-500">
                  {basePortion || "未設定"}
                </p>
              ) : (
                <input
                  type="text"
                  value={basePortion}
                  onChange={(e) => setBasePortion(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="100g"
                />
              )}
            </label>

            {/* 分量 */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                分量
                <span className="text-xs text-zinc-400 ml-1">
                  （基準量に対して食べた割合）
                </span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  className="flex-1 accent-zinc-900 dark:accent-white"
                />
                <span className="text-sm font-bold w-14 text-right">
                  {portion}%
                </span>
              </div>
              {Number(portion) !== 100 && (
                <p className="text-xs text-zinc-500">
                  カロリー・PFCが {portion}% に調整されます
                </p>
              )}
            </label>
          </div>

          <input type="hidden" name="adjustedCalories" value={adjustedCalories} />
          <input type="hidden" name="baseProtein" value={protein} />
          <input type="hidden" name="baseFat" value={fat} />
          <input type="hidden" name="baseCarb" value={carb} />

          {/* お気に入り追加トグル */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">お気に入りに追加</span>
            <button
              type="button"
              onClick={() => setAddToFavorite(!addToFavorite)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                addToFavorite ? "bg-amber-400" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  addToFavorite ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <input type="hidden" name="addToFavorite" value={addToFavorite ? "on" : ""} />
          </div>
          {addToFavorite && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              お気に入りは、基準量（100%）の栄養素で登録されます。分量は食事入力ごとに調整してください。
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </form>
      )}
    </div>
  );
}
