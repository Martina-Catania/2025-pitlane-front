import * as React from "react";

export interface RoleGateProps {
  role: string;
  userRole: string;
  children: React.ReactNode;
}

function RoleGate({ role, userRole, children }: RoleGateProps) {
  if (userRole !== role) return null;
  return <>{children}</>;
}

export { RoleGate };