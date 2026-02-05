// src/pages/VarforLasa.tsx
import KidsNav from './components/kidsNav'

export default function VarforLasa() {
  const menuItems = [
    { to: '/read-more-books', label: 'Hem' },
    { to: '/varforlasa', label: 'Varför läsa' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-yellow-200">
      <KidsNav items={menuItems} title="VARFÖR LÄSA?" />

      <div className="px-6 pt-6 pb-10 max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-6">
          Högläsning i förskolan
        </h1>

        <div className="space-y-4 text-slate-800 leading-relaxed text-lg">
          <p>
            Förskolan arbetar aktivt med högläsning eftersom det är en viktig del av barns språkutveckling och lärande. När barn får lyssna på sagor och berättelser tränar de sitt ordförråd, sin förståelse och sin förmåga att uttrycka tankar och känslor.
          </p>

          <p>
            Högläsning ger barn tillgång till texter och berättelser som de ännu inte själva kan läsa, vilket stärker fantasin och förståelsen för världen runt omkring dem.
          </p>

          <p>
            Läroplanen betonar också att barn ska få möta olika former av texter och kulturella uttryck. Genom högläsning lär de sig att text har ett syfte, att berättelser följer en struktur och att böcker kan ge både kunskap och glädje.
          </p>

          <p>
            Föräldrar har en viktig roll i detta. Att läsa tillsammans hemma, även bara några minuter om dagen, ger barnet extra möjlighet att utveckla språk och nyfikenhet på böcker. Det blir också en mysig stund av närhet och trygghet.
          </p>

          <p className="font-medium">
            Vi uppmuntrar er att läsa tillsammans med era barn, prata om bilder och handlingar, och skapa små <em>”jag-och-du-ögonblick”</em> som stärker språket och relationen ❤️
          </p>
        </div>
      </div>
    </div>
  )
}
