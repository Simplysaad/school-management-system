export default async function AdminDashboard({
  userId,
  schoolId,
}: {
  userId: string;
  schoolId: string;
}) {
  return (
    <div className="p-8 font-sans bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#172B4D]">
          School Administrator Portal
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          High-level institutional overview and management command center.
        </p>
        {/* Admin metrics and quick actions go here */}
      </div>
    </div>
  );
}
