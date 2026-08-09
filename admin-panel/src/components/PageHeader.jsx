import { MdAdd, MdSearch } from 'react-icons/md';

export default function PageHeader({ title, description, buttonLabel, onAdd, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      
      <div className="flex items-center gap-3">
        {action ? (
          action
        ) : (
          buttonLabel && (
            <button 
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <MdAdd className="w-5 h-5" />
              {buttonLabel}
            </button>
          )
        )}
      </div>
    </div>
  );
}
