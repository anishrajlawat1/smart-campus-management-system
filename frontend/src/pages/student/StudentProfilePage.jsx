import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Trash2,
  Mail,
  User,
  Phone,
  MapPin,
  GraduationCap,
  BadgeCheck,
  RefreshCw,
  Save,
  CalendarDays,
  Edit3,
  X,
} from 'lucide-react';
import StudentLayout from './StudentLayout';
import api from '../../api';

const StudentProfilePage = () => {
  const fileInputRef = useRef(null);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const [profile, setProfile] = useState(storedUser);
  const [loading, setLoading] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    dob: '',
  });

  const getFallbackImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Student'
    )}&background=4f46e5&color=ffffff&size=256`;

  const displayName =
    profile?.name ||
    profile?.full_name ||
    profile?.student_name ||
    storedUser?.name ||
    'Student';

  const displayEmail =
    profile?.email ||
    profile?.student_email ||
    storedUser?.email ||
    'No email available';

  const profileImage =
    profile?.profile_image ||
    profile?.image ||
    profile?.avatar ||
    '';

  const updateLocalUser = (updates) => {
    const updatedUser = {
      ...storedUser,
      ...profile,
      ...updates,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setProfile(updatedUser);
  };

  const syncForm = (data) => {
    setFormData({
      phone: data?.phone || '',
      address: data?.address || '',
      dob: data?.dob ? String(data.dob).slice(0, 10) : '',
    });
  };

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const res = await api.get('/student/profile');
      const profileData = res.data?.student || res.data;

      const mergedProfile = {
        ...storedUser,
        ...profileData,
      };

      setProfile(mergedProfile);
      syncForm(mergedProfile);
      localStorage.setItem('user', JSON.stringify(mergedProfile));
    } catch (error) {
      console.error('Failed to fetch student profile:', error);
      setProfile(storedUser);
      syncForm(storedUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleChangeProfileImage = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSavingImage(true);

    try {
      const form = new FormData();
      form.append('profile_image', file);

      const res = await api.post('/student/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedImage = res.data?.profile_image;

      updateLocalUser({
        profile_image: uploadedImage,
      });
    } catch (error) {
      console.error('Failed to update profile image:', error);
      alert(error.response?.data?.message || 'Failed to update profile image');
    } finally {
      setSavingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteProfileImage = async () => {
    try {
      await api.delete('/student/profile-image');

      updateLocalUser({
        profile_image: '',
        image: '',
        avatar: '',
      });
    } catch (error) {
      console.error('Failed to delete profile image:', error);
      alert(error.response?.data?.message || 'Failed to remove profile image');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setSavingProfile(true);

    try {
      const res = await api.put('/student/update-profile', formData);
      const updatedStudent = res.data?.student || {};

      const updatedProfile = {
        ...profile,
        ...updatedStudent,
        phone: formData.phone,
        address: formData.address,
        dob: formData.dob,
      };

      setProfile(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const className =
    profile?.course_name ||
    profile?.class_name ||
    profile?.group_name ||
    profile?.group_title ||
    '';

  const sectionName =
    profile?.section_name ||
    profile?.level_name ||
    profile?.section ||
    '';

  const classSectionValue =
    className || sectionName
      ? `${className || 'Class not added'} / ${sectionName || 'Section not added'}`
      : 'Not assigned yet';

  const infoCards = [
    {
      label: 'Student ID',
      value:
        profile?.student_id ||
        profile?.studentId ||
        profile?.roll_no ||
        profile?.roll_number ||
        profile?.id ||
        'Not added',
      icon: BadgeCheck,
    },
    {
      label: 'Class / Section',
      value: classSectionValue,
      icon: GraduationCap,
    },
    {
      label: 'Contact Number',
      value:
        profile?.phone ||
        profile?.contact ||
        profile?.contact_number ||
        profile?.mobile ||
        'Not added',
      icon: Phone,
    },
    {
      label: 'Address',
      value: profile?.address || profile?.location || 'Not added',
      icon: MapPin,
    },
    {
      label: 'Date of Birth',
      value: profile?.dob ? String(profile.dob).slice(0, 10) : 'Not added',
      icon: CalendarDays,
    },
    {
      label: 'Email',
      value: displayEmail,
      icon: Mail,
    },
    {
      label: 'Role',
      value: profile?.role || storedUser?.role || 'Student',
      icon: User,
    },
  ];

  return (
    <StudentLayout
      pageLabel="Student Module"
      title="Profile"
      subtitle="View and manage your student profile."
    >
      <div className="w-full max-w-300 space-y-8">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
          <div className="h-36 bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600" />

          <div className="px-6 md:px-8 pb-8">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 -mt-16">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6 min-w-0">
                <div className="relative w-32 h-32 shrink-0">
                  <img
                    src={profileImage || getFallbackImage(displayName)}
                    alt={displayName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl bg-white"
                  />

                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition"
                    title="Change profile picture"
                  >
                    <Camera size={18} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChangeProfileImage}
                    className="hidden"
                  />
                </div>

                <div className="pb-2 min-w-0">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 wrap-break-word">
                    {displayName}
                  </h2>

                  <p className="text-slate-500 font-medium mt-1 wrap-break-word">
                    {displayEmail}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold">
                      Student
                    </span>

                    {className && (
                      <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                        {className}
                      </span>
                    )}

                    {sectionName && (
                      <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                        {sectionName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 xl:justify-end">
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={savingImage}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  <Camera size={18} />
                  {savingImage ? 'Updating...' : 'Change Photo'}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteProfileImage}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition"
                >
                  <Trash2 size={18} />
                  Remove Photo
                </button>

                <button
                  type="button"
                  onClick={fetchProfile}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition disabled:opacity-60"
                >
                  <RefreshCw size={18} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-xl font-black text-slate-900">
              Profile Information
            </h3>

            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-100 text-slate-700 font-bold hover:border-indigo-200 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-50 transition"
            >
              {editing ? <X size={18} /> : <Edit3 size={18} />}
              {editing ? 'Cancel Edit' : 'Edit Details'}
            </button>
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {infoCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="bg-white p-6 min-h-40 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner mb-5">
                      <Icon size={24} />
                    </div>

                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      {item.label}
                    </p>

                    <h4 className="text-lg font-black text-slate-800 mt-2 wrap-break-word">
                      {item.value}
                    </h4>
                  </div>
                );
              })}
            </div>
          ) : (
            <form
              onSubmit={handleUpdateProfile}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                    placeholder="Enter contact number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dob: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  <Save size={18} />
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </StudentLayout>
  );
};

export default StudentProfilePage;