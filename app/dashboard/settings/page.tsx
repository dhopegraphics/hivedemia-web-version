"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  CreditCard,
  HelpCircle,
  Download,
  Trash2,
  Camera,
  Save,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Moon,
  Sun,
  Monitor,
  Volume2,
  Lock,
  Key,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/backend/store/authStore";

export default function SettingsPage() {
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Get user info
  const userName = session?.user?.email?.split("@")[0] || "Student";
  const userEmail = session?.user?.email || "";
  const userInitials =
    userName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  // Settings state
  const [settings, setSettings] = useState({
    // Profile settings
    firstName: userName.split(" ")[0] || "",
    lastName: userName.split(" ")[1] || "",
    email: userEmail,
    phone: "",
    location: "",
    dateOfBirth: "",
    institution: "",
    fieldOfStudy: "",
    bio: "",

    // Notification preferences
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    studyReminders: true,
    quizNotifications: true,
    achievementAlerts: true,
    weeklyProgress: true,

    // Privacy settings
    profileVisibility: "public",
    showProgressToFriends: true,
    allowDirectMessages: true,
    showOnlineStatus: true,
    dataSharing: false,

    // Appearance settings
    theme: "light",
    language: "en",
    timezone: "UTC",
    soundEffects: true,
    animations: true,
    compactMode: false,

    // Study preferences
    defaultStudyTime: "25",
    autoSaveNotes: true,
    showHints: true,
    difficultyPreference: "adaptive",
    preferredSubjects: [] as string[],

    // Security settings
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30",
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "study", label: "Study Preferences", icon: GraduationCap },
    { id: "security", label: "Security", icon: Lock },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    // Here you would implement the API call to save settings
    console.log("Saving settings:", settings);
    setUnsavedChanges(false);
    // Show success toast
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        setUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Profile Picture
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xl font-bold">
                  {userInitials}
                </span>
              </div>
            )}
            <label
              htmlFor="profile-upload"
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm text-text-secondary mb-2">
              Upload a new profile picture
            </p>
            <p className="text-xs text-text-tertiary">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              First Name
            </label>
            <input
              type="text"
              value={settings.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={settings.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                value={settings.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="City, Country"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Date of Birth
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="date"
                value={settings.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Institution
            </label>
            <input
              type="text"
              value={settings.institution}
              onChange={(e) => handleInputChange("institution", e.target.value)}
              placeholder="University or School Name"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Field of Study
            </label>
            <input
              type="text"
              value={settings.fieldOfStudy}
              onChange={(e) =>
                handleInputChange("fieldOfStudy", e.target.value)
              }
              placeholder="Major/Subject"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Bio
          </label>
          <textarea
            value={settings.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {[
            {
              key: "emailNotifications",
              label: "Email Notifications",
              desc: "Receive notifications via email",
            },
            {
              key: "pushNotifications",
              label: "Push Notifications",
              desc: "Receive push notifications in browser",
            },
            {
              key: "studyReminders",
              label: "Study Reminders",
              desc: "Get reminded about your study schedule",
            },
            {
              key: "quizNotifications",
              label: "Quiz Notifications",
              desc: "Notifications about new quizzes and results",
            },
            {
              key: "achievementAlerts",
              label: "Achievement Alerts",
              desc: "Get notified when you earn achievements",
            },
            {
              key: "weeklyProgress",
              label: "Weekly Progress",
              desc: "Weekly summary of your learning progress",
            },
            {
              key: "marketingEmails",
              label: "Marketing Emails",
              desc: "Promotional content and feature updates",
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-border-light last:border-b-0"
            >
              <div>
                <p className="font-medium text-text-primary">{label}</p>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Privacy Controls
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Profile Visibility
            </label>
            <select
              value={settings.profileVisibility}
              onChange={(e) =>
                handleInputChange("profileVisibility", e.target.value)
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {[
            {
              key: "showProgressToFriends",
              label: "Show Progress to Friends",
              desc: "Allow friends to see your learning progress",
            },
            {
              key: "allowDirectMessages",
              label: "Allow Direct Messages",
              desc: "Let other users send you messages",
            },
            {
              key: "showOnlineStatus",
              label: "Show Online Status",
              desc: "Display when you're online to others",
            },
            {
              key: "dataSharing",
              label: "Data Sharing for Analytics",
              desc: "Help improve Hivedemia with anonymous usage data",
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-border-light last:border-b-0"
            >
              <div>
                <p className="font-medium text-text-primary">{label}</p>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Data Management
        </h3>
        <div className="space-y-4">
          <button className="flex items-center gap-3 w-full p-4 border border-border rounded-lg hover:bg-surface transition-colors text-left">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-text-primary">
                Download Your Data
              </p>
              <p className="text-sm text-text-secondary">
                Export all your data in a portable format
              </p>
            </div>
          </button>
          <button className="flex items-center gap-3 w-full p-4 border border-danger-red/20 rounded-lg hover:bg-error-subtle transition-colors text-left">
            <Trash2 className="h-5 w-5 text-danger-red" />
            <div>
              <p className="font-medium text-danger-red">Delete Account</p>
              <p className="text-sm text-text-secondary">
                Permanently delete your account and all data
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Theme & Display
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleInputChange("theme", value)}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all ${
                    settings.theme === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleInputChange("language", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleInputChange("timezone", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          {[
            {
              key: "soundEffects",
              label: "Sound Effects",
              desc: "Play sounds for interactions and notifications",
              icon: Volume2,
            },
            {
              key: "animations",
              label: "Animations",
              desc: "Enable smooth animations and transitions",
              icon: RefreshCw,
            },
            {
              key: "compactMode",
              label: "Compact Mode",
              desc: "Reduce spacing for a more compact interface",
              icon: Monitor,
            },
          ].map(({ key, label, desc, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-border-light last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="font-medium text-text-primary">{label}</p>
                  <p className="text-sm text-text-secondary">{desc}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStudySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Study Preferences
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Default Study Session (minutes)
            </label>
            <select
              value={settings.defaultStudyTime}
              onChange={(e) =>
                handleInputChange("defaultStudyTime", e.target.value)
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="15">15 minutes</option>
              <option value="25">25 minutes (Pomodoro)</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Difficulty Preference
            </label>
            <select
              value={settings.difficultyPreference}
              onChange={(e) =>
                handleInputChange("difficultyPreference", e.target.value)
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="adaptive">Adaptive (Recommended)</option>
            </select>
          </div>

          {[
            {
              key: "autoSaveNotes",
              label: "Auto-Save Notes",
              desc: "Automatically save your notes as you type",
            },
            {
              key: "showHints",
              label: "Show Hints",
              desc: "Display helpful hints during quizzes and exercises",
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-border-light last:border-b-0"
            >
              <div>
                <p className="font-medium text-text-primary">{label}</p>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Password & Authentication
        </h3>
        <div className="space-y-4">
          <button className="flex items-center gap-3 w-full p-4 border border-border rounded-lg hover:bg-surface transition-colors text-left">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-text-primary">Change Password</p>
              <p className="text-sm text-text-secondary">
                Update your account password
              </p>
            </div>
          </button>

          <div className="flex items-center justify-between py-3 border-b border-border-light">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-text-tertiary" />
              <div>
                <p className="font-medium text-text-primary">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-text-secondary">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) =>
                  handleInputChange("twoFactorAuth", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Session Timeout (minutes)
            </label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) =>
                handleInputChange("sessionTimeout", e.target.value)
              }
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="0">Never</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text-primary">Login Alerts</p>
              <p className="text-sm text-text-secondary">
                Get notified of new device logins
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.loginAlerts}
                onChange={(e) =>
                  handleInputChange("loginAlerts", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Active Sessions
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-text-primary">Current Session</p>
                <p className="text-sm text-text-secondary">
                  Chrome on macOS • Active now
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-success-green/10 text-success-green text-xs rounded-full">
              Current
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Subscription Plan
        </h3>
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-primary">Free Plan</h4>
              <p className="text-sm text-text-secondary">
                Basic features with limited access
              </p>
            </div>
            <span className="px-3 py-1 bg-primary text-white text-sm rounded-full">
              Current
            </span>
          </div>
          <button className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            Upgrade to Premium
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Usage & Limits
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">AI Questions</span>
              <span className="text-sm font-medium">45 / 50</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: "90%" }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">
                Quiz Generations
              </span>
              <span className="text-sm font-medium">8 / 10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: "80%" }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">
                Document Uploads
              </span>
              <span className="text-sm font-medium">12 / 20</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupportSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Get Help
        </h3>
        <div className="space-y-3">
          <button className="flex items-center gap-3 w-full p-4 border border-border rounded-lg hover:bg-surface transition-colors text-left">
            <HelpCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-text-primary">Help Center</p>
              <p className="text-sm text-text-secondary">
                Browse our knowledge base and FAQs
              </p>
            </div>
          </button>
          <button className="flex items-center gap-3 w-full p-4 border border-border rounded-lg hover:bg-surface transition-colors text-left">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-text-primary">Contact Support</p>
              <p className="text-sm text-text-secondary">
                Get in touch with our support team
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          About Hivedemia
        </h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <p>Version 1.0.0</p>
          <p>© 2024 Hivedemia. All rights reserved.</p>
          <div className="flex gap-4 pt-2">
            <button className="text-primary hover:underline">
              Privacy Policy
            </button>
            <button className="text-primary hover:underline">
              Terms of Service
            </button>
            <button className="text-primary hover:underline">
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileSettings();
      case "notifications":
        return renderNotificationSettings();
      case "privacy":
        return renderPrivacySettings();
      case "appearance":
        return renderAppearanceSettings();
      case "study":
        return renderStudySettings();
      case "security":
        return renderSecuritySettings();
      case "billing":
        return renderBillingSettings();
      case "support":
        return renderSupportSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Settings
          </h1>
          <p className="text-text-secondary">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-primary text-white shadow-sm"
                          : "text-text-secondary hover:bg-surface hover:text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-6">
              {renderTabContent()}

              {/* Save Button */}
              {unsavedChanges && (
                <div className="sticky bottom-6 bg-white rounded-xl p-4 shadow-card-elevated border border-border-light">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning-orange" />
                      <p className="text-sm text-text-secondary">
                        You have unsaved changes
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setUnsavedChanges(false)}
                        className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-surface transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSaveSettings}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
