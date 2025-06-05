// /app/dashboard/history/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, users } from "@/app/lib/auth";

interface QRHistoryItem {
  id: number;
  original_url: string;
  short_url: string;
  correlativo: string;
  created_at: string;
  clicks?: number;
  qr_svg?: string; // Optional, if you want to display the QR image
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    } else {
      setUser(currentUser);
      fetchHistory(currentUser);
    }
  }, [router]);

  const fetchClicks = async (
    shortUrl: string,
    token: string
  ): Promise<number> => {
    try {
      const fullShortUrl = shortUrl;

      console.log("Fetching stats for full shortUrl:", fullShortUrl);

      const response = await fetch(
        `/api/stats?token=${token}&shorturl=${encodeURIComponent(fullShortUrl)}`
      );
      const data = await response.json();

      console.log("Stats response:", data);

      // ✔️ Correcto: data.link.clicks
      if (data && data.link && typeof data.link.clicks !== "undefined") {
        return parseInt(data.link.clicks, 10);
      }
    } catch (error) {
      console.error("Error fetching clicks for", shortUrl, error);
    }

    return 0; // fallback
  };

  const downloadSVG = (svgContent: string, filename: string) => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};


  const fetchHistory = async (username: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/history?username=${username}`);
      const data = await response.json();
      if (data.history) {
        setHistory(data.history);

        // Fetch clicks para cada item
        const updatedHistory = await Promise.all(
          data.history.map(async (item: QRHistoryItem) => {
            const userData = users.find((u) => u.username === username);
            const token = userData?.token || "";
            const clicks = await fetchClicks(item.short_url, token);
            return { ...item, clicks };
          })
        );

        setHistory(updatedHistory);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">Historial de QRs Generados</h1>

      {isLoading ? (
        <p className="text-gray-600">Cargando historial...</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-200 text-left text-gray-800">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Descargar</th>
              <th className="p-2 border">QR</th>
              <th className="p-2 border">Original URL</th>
              <th className="p-2 border">Short URL</th>
              <th className="p-2 border">Correlativo</th>
              <th className="p-2 border">Clicks</th>
              <th className="p-2 border">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-2 border text-center">{index + 1}</td>{" "}
                {/* # */}
                <td className="p-2 border text-center">
  {item.qr_svg ? (
    <button
      onClick={() => downloadSVG(item.qr_svg!, `qr_${item.id}`)}
      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
    >
      Descargar
    </button>
  ) : (
    '-'
  )}
</td>
                <td className="p-2 border text-center">
                  {" "}
                  {/* QR */}
                  {item.qr_svg ? (
                    <div dangerouslySetInnerHTML={{ __html: item.qr_svg }} />
                  ) : (
                    "-"
                  )}
                </td>
                
                <td className="p-2 border break-all">{item.original_url}</td>{" "}
                {/* Original URL */}
                <td className="p-2 border text-blue-600">
                  <a
                    href={item.short_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.short_url}
                  </a>
                </td>{" "}
                {/* Short URL */}
                <td className="p-2 border">{item.correlativo}</td>{" "}
                {/* Correlativo */}
                <td className="p-2 border text-center">
                  {item.clicks ?? "-"}
                </td>{" "}
                {/* Clicks */}
                <td className="p-2 border">
                  {new Date(item.created_at).toLocaleString()}
                </td>{" "}
                {/* Fecha */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
