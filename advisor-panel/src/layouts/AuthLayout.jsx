import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-variant flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-md3-3 p-8">
        <Outlet />
      </div>
    </div>
  );
}
