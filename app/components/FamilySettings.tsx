'use client';
import { useState } from 'react';
import { useTransactions } from '../context/TransactionsContext';
import { useAuth } from '../context/AuthContext';
import { X, Copy, Check, Users, LogOut, Trash2, Edit2, Shield, User } from 'lucide-react';

export default function FamilySettings({ onClose }: { onClose: () => void }) {
  const { familyName, inviteCode, members, updateFamilyName, removeMember, leaveFamily } = useTransactions();
  const { user, signOut } = useAuth();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(familyName);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async () => {
    if (newName.trim()) {
        await updateFamilyName(newName);
        setIsEditingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 z-50 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-dark flex items-center gap-2">
            <Users size={20} className="text-brand" /> Configurações
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="space-y-8">
            
            {/* Nome */}
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Nome do Grupo</label>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {isEditingName ? (
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-transparent outline-none font-bold text-dark w-full" autoFocus />
                    ) : (
                        <span className="font-bold text-dark">{familyName}</span>
                    )}
                    <button onClick={() => isEditingName ? handleSaveName() : setIsEditingName(true)} className="p-2 text-brand hover:bg-white rounded-lg transition-all">
                        {isEditingName ? <Check size={18} /> : <Edit2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Código Convite */}
            <div className="relative overflow-hidden bg-brand text-white p-5 rounded-2xl shadow-lg shadow-brand/20">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
                <label className="text-[10px] font-bold text-white/80 uppercase mb-2 block tracking-wider">Código de Convite</label>
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black tracking-widest">{inviteCode}</h2>
                    <button onClick={handleCopyCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-xs font-bold text-white active:scale-95 transition-transform">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </button>
                </div>
            </div>

            {/* Membros */}
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Membros ({members.length})</label>
                <div className="space-y-3">
                    {members.map((m) => {
                        const isMe = m.profile_id === user?.id;
                        return (
                            <div key={m.profile_id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isMe ? 'bg-dark' : 'bg-gray-300'}`}>
                                        {m.display_name ? m.display_name.charAt(0).toUpperCase() : <User size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-dark flex items-center gap-1">
                                            {m.display_name} {isMe && <span className="text-[10px] text-gray-400 font-normal">(Você)</span>}
                                        </p>
                                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                            {m.role === 'admin' && <Shield size={10} />} {m.role === 'admin' ? 'Administrador' : 'Membro'}
                                        </p>
                                    </div>
                                </div>
                                {!isMe && (
                                    <button onClick={() => { if(confirm('Remover este membro?')) removeMember(m.profile_id); }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-3">
                <button onClick={() => { if(confirm('Tem certeza que deseja sair da família?')) leaveFamily(); }} className="w-full py-3 flex items-center justify-center gap-2 text-gray-500 font-medium text-sm hover:bg-gray-50 rounded-xl transition-colors">
                    <LogOut size={16} /> Sair da Família
                </button>
                
                <button onClick={async () => { await signOut(); window.location.reload(); }} className="w-full py-3 flex items-center justify-center gap-2 text-red-500 font-bold text-sm bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                    Sair do App
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}