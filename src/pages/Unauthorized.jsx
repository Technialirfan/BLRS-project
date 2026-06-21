import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-900">
      <h1 className="text-4xl font-bold text-red-600">403</h1>
      <p className="mt-2 text-lg font-semibold">Unauthorized Access</p>
      <p className="mt-1 text-slate-600 dark:text-slate-300">You do not have permission to access this page.</p>
      <Link to="/login" className="mt-4 rounded-lg bg-[#1B4332] px-4 py-2 text-white">
        Back to Login
      </Link>
    </div>
  );
};

export default Unauthorized;
