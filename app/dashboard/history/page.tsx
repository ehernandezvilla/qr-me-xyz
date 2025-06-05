'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, users } from "@/app/lib/auth";
import { Download } from "lucide-react";

interface QRHistoryItem {
  id: number;
  original_url: string;
  short_url: string;
  correlativo: string;
  created_at: string;
  clicks?: number;
  qr_svg?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedUrl, setEditedUrl] = useState<string>("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    } else {
      setUser(currentUser);
      fetchHistory(currentUser);
    }
  }, [router]);

  const fetchClicks = async (shortUrl: string, token: string): Promise<number> => {
    try {
      const fullShortUrl = shortUrl;
      const response = await fetch(`/api/stats?token=${token}&shorturl=${encodeURIComponent(fullShortUrl)}`);
      const data = await response.json();

      if (data && data.link && typeof data.link.clicks !== "undefined") {
        return parseInt(data.link.clicks, 10);
      }
    } catch (error) {
      console.error("Error fetching clicks for", shortUrl, error);
    }

    return 0;
  };

  const downloadSVG = (svgContent: string, filename: string) => {
    let finalSvg = svgContent;
    if (finalSvg && !finalSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      finalSvg = finalSvg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    }

    const blob = new Blob([finalSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
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

  const startEdit = (id: number, currentUrl: string) => {
    setEditingId(id);
    setEditedUrl(currentUrl);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedUrl("");
  };

  const saveEditedUrl = async (id: number) => {
    try {
      const item = history.find(item => item.id === id);

      const response = await fetch('/api/update-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          new_url: editedUrl,
          short_url: item?.short_url,
          username: user,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('URL actualizada con éxito');
        fetchHistory(user!);
        cancelEdit();
      } else {
        console.error('Error updating URL:', result.message);
      }
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Historial de QRs Generados
      </h1>

      {isLoading ? (
        <p className="text-gray-600 dark:text-gray-400">Cargando historial...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3 text-center w-32">Descargar</th>
                <th className="px-4 py-3 text-center w-32">QR</th>
                <th className="px-4 py-3">Original URL</th>
                <th className="px-4 py-3">Short URL</th>
                <th className="px-4 py-3">Correlativo</th>
                <th className="px-4 py-3 text-center w-20">Clicks</th>
                <th className="px-4 py-3 w-40">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {history.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-3 text-center font-medium">{index + 1}</td>

                  <td className="px-4 py-3 text-center">
                    {item.qr_svg ? (
                      <button
                        onClick={() => downloadSVG(item.qr_svg!, `qr_${item.id}`)}
                        className="flex items-center justify-center mx-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                      >
                        <Download size={16} className="mr-1" />
                        Descargar
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-3 text-center align-middle">
                    {item.qr_svg ? (
                      <div className="relative w-24 mx-auto">
                        <div className="pb-[100%] relative border border-gray-200 dark:border-gray-700 rounded bg-white">
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: item.qr_svg }}
                          />
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-3 break-words max-w-xs text-white">
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-2 text-white">
                        <input
                          type="text"
                          value={editedUrl}
                          onChange={(e) => setEditedUrl(e.target.value)}
                          className="border p-1 rounded w-full text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEditedUrl(item.id)}
                            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center gap-2 text-white">
                        <span className="flex-1 break-words">{item.original_url}</span>
                        <button
                          onClick={() => startEdit(item.id, item.original_url)}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-blue-600 hover:underline break-words">
                    <a
                      href={item.short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.short_url}
                    </a>
                  </td>

                  <td className="px-4 py-3">{item.correlativo}</td>

                  <td className="px-4 py-3 text-center">{item.clicks ?? "-"}</td>

                  <td className="px-4 py-3">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
