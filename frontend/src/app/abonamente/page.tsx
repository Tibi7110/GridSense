import Link from 'next/link';

export default function AbonamentePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-900 hover:underline">
          ← Înapoi
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Planuri de abonament</h1>
      <p className="text-gray-600">Alege planul potrivit pentru tine. Toate planurile pot fi anulate oricând.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold">Gratuit</h2>
          <p className="text-3xl font-bold mt-2">0 RON<span className="text-base font-normal text-gray-500">/lună</span></p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Vizualizare scor în timp real</li>
            <li>• 3 ferestre recomandate/zi</li>
            <li>• Notificare manuală</li>
          </ul>
          <button className="mt-6 w-full bg-gray-900 text-white py-2 rounded-md hover:bg-black">Începe gratuit</button>
        </div>

        {/* Pro */}
        <div className="border rounded-lg p-6 bg-white shadow-md ring-2 ring-blue-200">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p className="text-3xl font-bold mt-2">19 RON<span className="text-base font-normal text-gray-500">/lună</span></p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Programare automată ferestre</li>
            <li>• Notificări push</li>
            <li>• Istoric 30 de zile</li>
          </ul>
          <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Alege Pro</button>
        </div>

        {/* Business */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold">Business</h2>
          <p className="text-3xl font-bold mt-2">49 RON<span className="text-base font-normal text-gray-500">/lună</span></p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Integrare dispozitive multiple</li>
            <li>• API și SLA</li>
            <li>• Suport prioritar</li>
          </ul>
          <button className="mt-6 w-full bg-gray-900 text-white py-2 rounded-md hover:bg-black">Contactează-ne</button>
        </div>
      </div>

    </main>
  );
}
