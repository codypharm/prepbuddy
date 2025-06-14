import React, { useState } from "react";
import {
  BookOpen,
  User,
  LogOut,
  Settings,
  Award,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSubscriptionStore } from "../stores/useSubscriptionStore";
import AuthModal from "./AuthModal";
import UserProfile from "./UserProfile";
import ThemeToggle from "./ThemeToggle";
import { useAuthStore } from "../stores/useAuthStore";

interface HeaderProps {
  onNavigate: (
    view:
      | "dashboard"
      | "create"
      | "generate"
      | "study"
      | "quiz"
      | "pricing"
      | "billing"
      | "landing",
  ) => void;
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const { isAuthenticated: storeIsAuthenticated, profile } = useAuthStore();
  const { getCurrentPlan, isSubscribed } = useSubscriptionStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentPlan = getCurrentPlan();

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
    onNavigate("dashboard");
  };

  const handleSettingsClick = () => {
    setShowUserProfile(true);
    setShowUserMenu(false);
  };

  // Use either isAuthenticated from useAuth or from useAuthStore
  const userIsAuthenticated = isAuthenticated || storeIsAuthenticated;

  // Use either user from useAuth or profile from useAuthStore
  const displayUser =
    user ||
    (profile
      ? {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar_url,
          stats: profile.stats || { level: 1 },
        }
      : null);

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => onNavigate("dashboard")}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PrepBuddy
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI Study Assistant
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            {userIsAuthenticated && (
              <nav className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === "dashboard"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate("pricing")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === "pricing"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Pricing
                </button>
                <button
                  onClick={() => onNavigate("billing")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === "billing"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Billing
                </button>
              </nav>
            )}

            <div className="flex items-center space-x-4">
              {/* Plan Badge */}
              {userIsAuthenticated && (
                <div className="hidden sm:flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isSubscribed()
                        ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400 dark:border-purple-700"
                        : "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {currentPlan.name}
                  </span>
                </div>
              )}

              {/* Pricing Link for Non-Authenticated Users */}
              {!userIsAuthenticated && (
                <button
                  onClick={() => onNavigate("pricing")}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-medium"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Pricing
                </button>
              )}

              {/* Theme Toggle */}
              <div className="isolate">
                <ThemeToggle />
              </div>

              {userIsAuthenticated && displayUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <img
                      src={
                        displayUser.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayUser.name)}`
                      }
                      alt={displayUser.name}
                      className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"
                    />
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {displayUser.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Level {displayUser.stats?.level || 1}
                      </div>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              displayUser.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayUser.name)}`
                            }
                            alt={displayUser.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {displayUser.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {displayUser.email}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                              <Award className="h-3 w-3 mr-1" />
                              Level {displayUser.stats?.level || 1} •{" "}
                              {displayUser.stats?.totalXP || 0} XP
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserProfile(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        View Profile
                      </button>

                      <button
                        onClick={() => {
                          onNavigate("billing");
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <CreditCard className="h-4 w-4 mr-3" />
                        Billing & Plans
                      </button>

                      <button
                        onClick={handleSettingsClick}
                        className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </button>

                      <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Header;
