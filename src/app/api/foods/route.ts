import { NextRequest, NextResponse } from "next/server";
import foods from "@/data/foods.json";
import aliases from "@/data/food-aliases.json";

type Food = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
};

const foodList = foods as Food[];
const aliasMap = aliases as Record<string, string[]>;

// 正式名称→わかりやすい表示名に変換
function friendlyName(name: string): string {
  return name
    // 記号類の整理
    .replace(/＜[^＞]+＞\s*/g, "")
    .replace(/［水稲めし］/g, "ごはん（炊き上がり）")
    .replace(/［水稲穀粒］/g, "生米")
    .replace(/［水稲がゆ］/g, "おかゆ")
    .replace(/［陸稲めし］/g, "ごはん（陸稲）")
    .replace(/［もち米製品］/g, "もち米")
    .replace(/［うるち米製品］/g, "うるち米")
    .replace(/こめ\s*/g, "米 ")
    .replace(/にわとり\s*/g, "鶏肉 ")
    .replace(/ぶた\s*/g, "豚肉 ")
    .replace(/うし\s*/g, "牛肉 ")
    .replace(/［若鶏肉］/g, "（若鶏）")
    .replace(/［親・主品目］/g, "（親鶏）")
    .replace(/［副生物］/g, "（内臓）")
    .replace(/［和牛肉］/g, "（和牛）")
    .replace(/［乳用肥育牛肉］/g, "（国産牛）")
    .replace(/［輸入牛肉］/g, "（輸入牛）")
    .replace(/［交雑牛肉］/g, "（交雑牛）")
    .replace(/［大型種肉］/g, "")
    .replace(/［中型種肉］/g, "")
    .replace(/［ひき肉］/g, "ひき肉")
    .replace(/鶏卵\s*/g, "卵 ")
    .replace(/だいこん/g, "大根")
    .replace(/にんじん/g, "人参")
    .replace(/たまねぎ/g, "玉ねぎ")
    .replace(/はくさい/g, "白菜")
    .replace(/ほうれんそう/g, "ほうれん草")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json([]);
  }

  // エイリアス展開: 入力キーワードを正式名称のキーワードに変換
  const inputKeywords = q.split(/\s+/).filter(Boolean);
  const expandedKeywords: string[] = [];

  for (const kw of inputKeywords) {
    // 完全一致のエイリアスがあればそれを使う
    if (aliasMap[kw]) {
      expandedKeywords.push(...aliasMap[kw]);
    } else {
      // 部分一致でエイリアスを探す
      let found = false;
      for (const [alias, terms] of Object.entries(aliasMap)) {
        if (alias.includes(kw) || kw.includes(alias)) {
          expandedKeywords.push(...terms);
          found = true;
          break;
        }
      }
      if (!found) {
        expandedKeywords.push(kw);
      }
    }
  }

  // 展開されたキーワード全てにマッチする食品を検索
  const results = foodList
    .filter((food) => {
      const name = food.name.toLowerCase();
      return expandedKeywords.every((kw) => name.includes(kw.toLowerCase()));
    })
    .slice(0, 30);

  // 結果が少ない場合、元のキーワードでも検索して追加
  if (results.length < 10) {
    const resultIds = new Set(results.map((r) => r.id));
    const fallback = foodList
      .filter((food) => {
        if (resultIds.has(food.id)) return false;
        const name = food.name.toLowerCase();
        return inputKeywords.some((kw) => name.includes(kw.toLowerCase()));
      })
      .slice(0, 30 - results.length);
    results.push(...fallback);
  }

  const friendly = results.map((f) => ({
    ...f,
    name: friendlyName(f.name),
  }));

  return NextResponse.json(friendly);
}
