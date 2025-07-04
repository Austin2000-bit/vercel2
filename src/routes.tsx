import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from "@/utils/auth";

// Loading component
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Lazy load components
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Admin = React.lazy(() => import("./pages/Admin"));
const Complaint = React.lazy(() => import("./pages/Complaint"));
const ComplaintList = React.lazy(() => import("./pages/ComplaintList"));
const Helper = React.lazy(() => import("./pages/Helper"));
const Student = React.lazy(() => import("./pages/Student"));
const RideBooking = React.lazy(() => import("./pages/RideBooking"));
const ConfirmationLogs = React.lazy(() => import("./pages/ConfirmationLogs"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Driver = React.lazy(() => import("./pages/Driver"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <PublicRoute><Login /></PublicRoute>
  },
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>
  },
  // Admin only routes
  {
    path: "/register",
    element: <ProtectedRoute requiredRoles={["admin"]}><Register /></ProtectedRoute>
  },
  {
    path: "/admin",
    element: <ProtectedRoute requiredRoles={["admin"]}><Admin /></ProtectedRoute>
  },
  {
    path: "/confirmation-logs",
    element: <ProtectedRoute requiredRoles={["admin"]}><ConfirmationLogs /></ProtectedRoute>
  },
  {
    path: "/complaint/list",
    element: <ProtectedRoute requiredRoles={["admin"]}><ComplaintList /></ProtectedRoute>
  },
  // Helper only routes
  {
    path: "/helper",
    element: <ProtectedRoute requiredRoles={["helper"]}><Helper /></ProtectedRoute>
  },
  // Student only routes
  {
    path: "/student",
    element: <ProtectedRoute requiredRoles={["student"]}><Student /></ProtectedRoute>
  },
  // Driver only routes
  {
    path: "/driver",
    element: <ProtectedRoute requiredRoles={["driver"]}><Driver /></ProtectedRoute>
  },
  // Shared routes
  {
    path: "/complaint",
    element: <ProtectedRoute><Complaint /></ProtectedRoute>
  },
  {
    path: "/book-ride",
    element: <ProtectedRoute><RideBooking /></ProtectedRoute>
  },
  {
    path: "/messages",
    element: <ProtectedRoute><Messages /></ProtectedRoute>
  },
  {
    path: "*",
    element: <NotFound />
  }
]; 