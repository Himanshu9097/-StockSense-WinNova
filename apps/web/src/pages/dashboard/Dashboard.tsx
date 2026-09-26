import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

type Item = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [page, filter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/users`, {
        params: { page, limit: 10, search: filter }
      });
      setItems(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch items", error);
    } finally {
      setLoading(false);
    }
  };

  const optimizedItems = useMemo(() => {
    return items.map(item => (
      <tr key={item._id} className="border-b border-border">
        <td className="p-3">{item.name}</td>
        <td className="p-3">{item.email}</td>
        <td className="p-3">{item.role}</td>
      </tr>
    ));
  }, [items]);

  return (
    <div className="min-h-screen bg-background text-text-primary p-8">
      <h1 className="text-3xl font-bold mb-6 text-primary">System Users</h1>
      
      <div className="mb-6 flex gap-4">
        <input 
          type="text" 
          placeholder="Filter by name or email..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary w-full max-w-md"
        />
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-elevated border-b border-border">
            <tr>
              <th className="p-3 font-semibold text-text-secondary">Name</th>
              <th className="p-3 font-semibold text-text-secondary">Email</th>
              <th className="p-3 font-semibold text-text-secondary">Role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr> : optimizedItems}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button 
          disabled={page === 1} 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-4 py-2 bg-surface border border-border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages} 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          className="px-4 py-2 bg-surface border border-border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
