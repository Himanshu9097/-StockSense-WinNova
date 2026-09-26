import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

type Adjustment = {
  _id: string;
  productId: { _id: string; name: string; sku: string };
  warehouseId: { _id: string; name: string };
  locationId: { _id: string; name: string };
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  reason: string;
  createdBy: { _id: string; name: string };
  createdAt: string;
  status: string;
};

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    try {
      // Assuming we have an interceptor or we pass withCredentials for the cookie
      const res = await axios.get('http://localhost:5000/api/adjustments', { withCredentials: true });
      setAdjustments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalAdjustments = adjustments.length;
  const totalUnitsAdjusted = adjustments.reduce((acc, a) => acc + Math.abs(a.difference), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">Stock Adjustments</h1>
          <p className="text-text-secondary mt-1 text-sm">Reconcile physical stock with recorded inventory.</p>
        </div>
        <Link 
          to="/adjustments/new" 
          className="bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-[0.98]"
        >
          + New Adjustment
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface-elevated border border-border p-6 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <p className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wider">Total Adjustments</p>
          <p className="text-4xl tracking-tighter text-primary">{totalAdjustments}</p>
        </div>
        <div className="bg-surface-elevated border border-border p-6 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <p className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wider">Pending Adjustments</p>
          <p className="text-4xl tracking-tighter text-primary">0</p>
        </div>
        <div className="bg-surface-elevated border border-border p-6 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <p className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wider">Adjustments Today</p>
          <p className="text-4xl tracking-tighter text-primary">{totalAdjustments}</p>
        </div>
        <div className="bg-surface-elevated border border-border p-6 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <p className="text-text-secondary text-xs font-medium mb-2 uppercase tracking-wider">Total Units Adjusted</p>
          <p className="text-4xl tracking-tighter text-primary">{totalUnitsAdjusted}</p>
        </div>
      </div>

      <div className="bg-surface-elevated border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-lg">Adjustment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface border-b border-border text-text-secondary">
              <tr>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium text-right">System</th>
                <th className="p-4 font-medium text-right">Physical</th>
                <th className="p-4 font-medium text-right">Diff</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-12 text-center text-text-secondary text-sm">Loading adjustments...</td></tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center">
                    <p className="text-text-secondary text-sm mb-4">Stock corrections will appear here once physical counts are reconciled.</p>
                    <Link to="/adjustments/new" className="text-accent font-medium text-sm hover:underline">Create First Adjustment</Link>
                  </td>
                </tr>
              ) : adjustments.map((adj) => (
                <tr key={adj._id} className="border-b border-border hover:bg-surface/50 transition-colors">
                  <td className="p-4 font-medium">{adj.productId?.name}</td>
                  <td className="p-4 text-text-secondary">{adj.productId?.sku}</td>
                  <td className="p-4">{adj.warehouseId?.name} / {adj.locationId?.name}</td>
                  <td className="p-4 text-right">{adj.systemQuantity}</td>
                  <td className="p-4 text-right font-medium">{adj.countedQuantity}</td>
                  <td className={`p-4 text-right font-medium ${adj.difference > 0 ? 'text-success' : adj.difference < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                    {adj.difference > 0 ? '+' : ''}{adj.difference}
                  </td>
                  <td className="p-4 text-text-secondary">{adj.reason}</td>
                  <td className="p-4 text-text-secondary">{new Date(adj.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="bg-success/10 text-success px-2 py-1 rounded-full text-xs font-medium border border-success/20">
                      {adj.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
