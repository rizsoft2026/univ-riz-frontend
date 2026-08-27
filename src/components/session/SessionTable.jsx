import { Edit2, Eye, Trash2, Power, PowerOff } from 'lucide-react';

const SessionTable = ({ sessions, onEdit, onView, onDelete, onToggleStatus }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center flex-1 flex flex-col justify-center items-center">
        <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center mb-5 shadow-inner">
          <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No sessions found</h3>
        <p className="text-gray-500 text-sm font-medium">Get started by creating a new academic session to manage programs.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden relative z-10">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/80 text-gray-500 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Session Name</th>
              <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Timeline (Year)</th>
              <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Program Structure</th>
              <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Entry Type</th>
              <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">Status</th>
              <th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {session.sessionName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="font-semibold text-gray-700">{session.startYear}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      <span className="font-semibold text-gray-700">{session.endYear}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-800">{session.duration} Year(s)</span>
                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block w-max">
                      {session.totalSemesters} Semesters
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {session.entryType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold shadow-sm ${
                      session.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onView(session)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(session)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(session)}
                      className={`p-2 rounded-xl transition-all ${
                        session.status === 'Active'
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={session.status === 'Active' ? 'Deactivate' : 'Activate'}
                    >
                      {session.status === 'Active' ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(session)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionTable;
