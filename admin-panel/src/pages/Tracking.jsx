import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

export default function Tracking() {
  return (
    <div className="max-w-7xl mx-auto pb-10">
      <PageHeader 
        title="GPS Tracking" 
        description="Monitor live locations of advisors and deliveries" 
      />
      <div className="w-full h-[600px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 font-medium">
        Map Integration Pending
      </div>
    </div>
  );
}
