import Link from "next/link";
import { AppShell } from "../components/app-shell";

export default function HelpPage() {
  return (
    <AppShell>
      <div className="flex flex-col flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <Link
          href="/settings"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
        >
          &lt; 戻る
        </Link>

        <h1 className="text-2xl font-bold mb-8">使い方ガイド</h1>

        {/* アカウント登録 */}
        <Section title="1. アカウント登録・ログイン">
          <p>
            <strong>Googleアカウント</strong>: 「ログイン / 新規登録」→「Googleでログイン」をタップ
          </p>
          <p className="mt-2">
            <strong>メールアドレス</strong>: 「新規登録」をタップ → 名前・メール・パスワード（8文字以上）を入力
          </p>
        </Section>

        {/* 初期設定 */}
        <Section title="2. 初期設定">
          <p>
            ログイン後、まずプロフィール（性別・年齢・身長・体重・活動レベル）を登録します。基礎代謝と総消費カロリーが自動計算されます。
          </p>
          <p className="mt-2">
            次に「設定 → ボディメイク設定」から目標体重と達成期限を設定すると、1日の目標カロリーとPFCが自動算出されます。
          </p>
        </Section>

        {/* ダッシュボード */}
        <Section title="3. ダッシュボード">
          <p>上部の3本の横バーをタップして切り替えできます。</p>
          <ul className="mt-2 flex flex-col gap-1">
            <Li>カロリー — 円形グラフで残り摂取カロリーを表示</Li>
            <Li>PFC — タンパク質・脂質・炭水化物の残り摂取量</Li>
            <Li>体重/体脂肪 — 現在値と目標との差</Li>
          </ul>
          <p className="mt-2">日付バーをタップすると過去のデータを確認できます。</p>
        </Section>

        {/* 食事記録 */}
        <Section title="4. 食事の記録">
          <p className="font-medium">検索入力（おすすめ）</p>
          <ol className="mt-1 flex flex-col gap-1 list-decimal list-inside">
            <li>食品名を入力して検索（例: ご飯、鶏肉、バナナ）</li>
            <li>一覧から選ぶと栄養素が自動入力</li>
            <li>分量を調整して保存</li>
          </ol>
          <p className="mt-3 font-medium">お気に入り機能</p>
          <ul className="mt-1 flex flex-col gap-1">
            <Li>「お気に入りに追加」をオンにして保存すると登録</Li>
            <Li>基準量（100%）の栄養素で保存されます</Li>
            <Li>次回は「お気に入り」タブから選んで分量だけ調整</Li>
          </ul>
        </Section>

        {/* 体重記録 */}
        <Section title="5. 体重の記録">
          <p>日付・体重・体脂肪率（任意）を入力して保存します。直近の推移グラフも確認できます。</p>
        </Section>

        {/* 運動記録 */}
        <Section title="6. 運動の記録">
          <p>活動内容をボタンから選択し、時間を入力すると消費カロリーが自動推定されます。</p>
          <p className="mt-2 text-xs text-zinc-400">
            対応: ウォーキング、ランニング、自転車、水泳、筋トレ、ヨガ、階段、掃除、ダンス、テニス、ゴルフ、登山 + 自由入力
          </p>
        </Section>

        {/* グラフ */}
        <Section title="7. グラフ">
          <p>ダッシュボード右上のグラフアイコンからアクセス。期間を指定して、P/F/C・kcal・kg・%のデータを表示できます。</p>
          <p className="mt-2">最大2グループまで同時に表示可能です（P/F/Cはセット）。</p>
        </Section>

        {/* 分量について */}
        <Section title="よくある質問">
          <p className="font-medium">Q. 分量って何？</p>
          <p>基準量に対して食べた割合です。半分なら50%、1.5倍なら150%にスライダーを動かしてください。</p>
          <p className="font-medium mt-3">Q. 検索で食品が見つからない</p>
          <p>カタカナ・ひらがな・漢字を変えて試してください。約2,500品目の文科省データを搭載しています。</p>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-zinc-400 mt-0.5">•</span>
      <span>{children}</span>
    </li>
  );
}
