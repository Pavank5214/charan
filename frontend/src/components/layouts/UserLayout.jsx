// src/layouts/UserLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../common/SideBar';

const UserLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideBar />

      {/* Main content auto-adjusts */}
      <main className="flex-1 min-h-screen transition-all duration-300 lg:ml-72 [&.sidebar-collapsed_~_&]:lg:!ml-20">
        <div className="pt-16 lg:pt-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserLayout;