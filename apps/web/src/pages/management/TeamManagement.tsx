import { useState } from 'react';
import { Users, Plus, Shield, Mail, MoreVertical, Trash2 } from 'lucide-react';
import api from '../../api';

export default function TeamManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  const [members, setMembers] = useState([
    { id: 1, name: 'Himanshu', email: 'himanshu@stocksense.com', role: 'ORG_ADMIN', status: 'ACTIVE', lastActive: '2 mins ago' },
    { id: 2, name: 'Alice Smith', email: 'alice@stocksense.com', role: 'STAFF', status: 'ACTIVE', lastActive: '1 hour ago' },
    { id: 3, name: 'Bob Jones', email: 'bob@stocksense.com', role: 'STAFF', status: 'PENDING', lastActive: 'Never' }
  ]);

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const [inviteData, setInviteData] = useState({ email: '', role: 'STAFF' });
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/invite', inviteData);
      
      setMembers([...members, response.data.user]);
      setIsModalOpen(false);
      setInviteData({ email: '', role: 'STAFF' });
      alert('Invitation successfully sent to ' + inviteData.email);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden relative">
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Team Management</h2>
          <p className="text-md-surface-variant mt-1">Manage warehouse staff and their access levels</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
            <Plus className="w-5 h-5" />
            Invite Staff
          </button>
        </div>
      </div>

      <div className="flex px-8 border-b border-md-outline/10 gap-8">
        <button 
          onClick={() => setActiveTab('members')}
          className={`py-4 font-bold border-b-4 transition-colors ${activeTab === 'members' ? 'border-md-primary text-md-primary' : 'border-transparent text-md-surface-variant hover:text-md-on-surface'}`}
        >
          Members ({members.length})
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`py-4 font-bold border-b-4 transition-colors ${activeTab === 'roles' ? 'border-md-primary text-md-primary' : 'border-transparent text-md-surface-variant hover:text-md-on-surface'}`}
        >
          Roles & Permissions
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {activeTab === 'members' && (
          <div className="bg-md-surface-container-low rounded-[32px] overflow-hidden border border-md-outline/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-md-surface-container-highest/50">
                  <th className="py-4 px-6 font-bold text-sm text-md-surface-variant uppercase tracking-wider">User</th>
                  <th className="py-4 px-6 font-bold text-sm text-md-surface-variant uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 font-bold text-sm text-md-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold text-sm text-md-surface-variant uppercase tracking-wider">Last Active</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline/10">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-md-surface-container-highest/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-md-secondary-container text-md-on-secondary-container flex items-center justify-center font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-md-on-background capitalize">{member.name}</div>
                          <div className="text-sm text-md-surface-variant">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-md-surface-variant" />
                        <span className="font-medium text-md-on-surface">{member.role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-md-surface-variant font-medium">
                      {member.lastActive}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-md-surface-variant hover:text-md-error rounded-full hover:bg-md-error/10 transition-colors"
                        title="Remove Staff"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="flex items-center justify-center h-40 text-md-surface-variant font-medium">
            Role customization coming soon!
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-md-surface rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-md-on-background mb-6 flex items-center gap-2">
              <Mail className="w-6 h-6 text-md-primary" />
              Invite Staff
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-md-on-surface mb-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={inviteData.email}
                  onChange={e => setInviteData({...inviteData, email: e.target.value})}
                  placeholder="staff@example.com" 
                  className="w-full bg-md-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-md-primary" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-md-on-surface mb-1">Role</label>
                <select 
                  value={inviteData.role}
                  onChange={e => setInviteData({...inviteData, role: e.target.value})}
                  className="w-full bg-md-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-md-primary"
                >
                  <option value="STAFF">Warehouse Staff (Pick/Putaway/Transfer)</option>
                  <option value="MANAGER">Warehouse Manager</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>
              </div>
              
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-full font-bold text-md-on-surface bg-md-surface-container-highest hover:bg-md-outline/10 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 rounded-full font-bold text-md-on-primary bg-md-primary hover:bg-md-primary/90 transition-colors">
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
