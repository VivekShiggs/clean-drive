interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

export default function StatCard({ label, value, icon, color, sub }: Props) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
