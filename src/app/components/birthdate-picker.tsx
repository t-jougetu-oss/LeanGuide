"use client";

interface Props {
  name: string;
  value: string; // "YYYY-MM-DD" 形式または空文字
  onChange: (value: string) => void;
  required?: boolean;
}

const currentYear = new Date().getFullYear();

// 10歳〜100歳の範囲（降順 = 新しい年から並べる）
const years: number[] = [];
for (let y = currentYear - 10; y >= currentYear - 100; y--) years.push(y);

const months = Array.from({ length: 12 }, (_, i) => i + 1);

export function BirthDatePicker({ name, value, onChange, required }: Props) {
  const [year, month, day] = value
    ? value.split("-").map((p, i) => (i === 0 ? p : String(Number(p))))
    : ["", "", ""];

  // 年・月から月末の日数を計算（うるう年・31日月対応）
  const daysInMonth =
    year && month
      ? new Date(Number(year), Number(month), 0).getDate()
      : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function update(y: string, m: string, d: string) {
    // 月の変更で日が範囲外になったらクランプ
    let newDay = d;
    if (y && m && d) {
      const maxDays = new Date(Number(y), Number(m), 0).getDate();
      if (Number(d) > maxDays) newDay = String(maxDays);
    }
    if (y && m && newDay) {
      onChange(`${y}-${m.padStart(2, "0")}-${newDay.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  }

  const selectClass =
    "flex-1 rounded-xl border border-orange-300 bg-white px-2 py-3 text-base text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <>
      <div className="flex gap-2">
        <select
          aria-label="年"
          value={year}
          onChange={(e) => update(e.target.value, month, day)}
          className={selectClass}
        >
          <option value="">年</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}年
            </option>
          ))}
        </select>
        <select
          aria-label="月"
          value={month}
          onChange={(e) => update(year, e.target.value, day)}
          className={selectClass}
        >
          <option value="">月</option>
          {months.map((m) => (
            <option key={m} value={String(m)}>
              {m}月
            </option>
          ))}
        </select>
        <select
          aria-label="日"
          value={day}
          onChange={(e) => update(year, month, e.target.value)}
          className={selectClass}
        >
          <option value="">日</option>
          {days.map((d) => (
            <option key={d} value={String(d)}>
              {d}日
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" name={name} value={value} required={required} />
    </>
  );
}
