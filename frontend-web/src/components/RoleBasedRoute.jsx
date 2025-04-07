import React from 'react';
import { Outlet } from 'react-router-dom';
import { authService } from '../services/api';
import AccessDenied from './AccessDenied';

/**
 * RoleBasedRoute component to restrict access based on user roles
 * @param {Object} props - Component props
 * @param {Array<string>} props.allowedRoles - Array of roles allowed to access the route
 */
const RoleBasedRoute = ({ allowedRoles }) => {
  const userRole = authService.getUserRole();
  
  // Check if user's role is in the allowed roles
  const isAllowed = allowedRoles.includes(userRole);
  
  // If user is not allowed, show the access denied page
  if (!isAllowed) {
    return <AccessDenied />;
  }
  
  // If user is allowed, render the child routes
  return <Outlet />;
};

export default RoleBasedRoute;
