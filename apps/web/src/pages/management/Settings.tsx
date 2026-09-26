import { Settings as SettingsIcon, Users, Building, Shield, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  
  const sections = [
    { id: 'org', icon: Building, title: 'Organization', desc: 'Manage company details and locations', path: '/settings/org' },
    { id: 'team', icon: Users, title: 'Team Management', desc: 'Invite staff and manage roles', path: '/settings/team' },
    { id: 'security', icon: Shield, title: 'Security', desc: 'Configure 2FA and session policies', path: '/settings/security' },
    { id: 'notifications', icon: Bell, title: 'Notifications', desc: 'Alert preferences and webhooks', path: '/settings/notifications' }
  ];

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      <div className="p-8 border-b border-md-outline/10">
        <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Settings</h2>
        <p className="text-md-surface-variant mt-1">Configure your warehouse system</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sections.map(section => (
            <div 
              key={section.id} 
              onClick={() => navigate(section.path)}
              className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-md-primary/20 flex gap-6 items-center group">
              <div className="w-16 h-16 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <section.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-md-on-background">{section.title}</h3>
                <p className="text-md-surface-variant mt-1">{section.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
