import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

interface RequireRoleProps {
  roles: string[];
  children: React.ReactNode;
}

export default function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, viewAsRole } = useAuth();
  const effectiveRole = viewAsRole || user?.role;

  if (!effectiveRole || !(roles.includes(effectiveRole) || effectiveRole === 'ADMIN' || (effectiveRole === 'COO' && roles.includes('ADMIN')))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
