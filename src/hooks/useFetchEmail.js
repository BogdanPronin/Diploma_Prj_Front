import { useState, useEffect } from "react";
import { fetchEmails } from "../api/emails";

export default function useFetchEmails(category) {
  const [emails, setEmails] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmails([]); // Очистка списка при смене категории
    setPage(1);
    loadMoreEmails(1);
  }, [category]);

  const loadMoreEmails = async (pageNum) => {
    if (loading) return;
    setLoading(true);
    
    console.log(`📩 Запрос писем для категории: ${category} (страница ${pageNum})`);
    
    const data = await fetchEmails(category, pageNum);
    setEmails((prevEmails) => [...prevEmails, ...data.messages]);
    setPage(pageNum);
    
    setLoading(false);
  };

  return { emails, loadMoreEmails, loading };
}
