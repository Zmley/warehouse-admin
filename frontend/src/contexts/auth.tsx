import React, { createContext, useState } from "react";
import { areTokensValid } from "../utils/Storages";
import { fetchUserProfile } from "../api/authApi";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  warehouseID: string;
  warehouseCode: string;
}

interface AuthContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuth: boolean) => void;
  getMe: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    warehouseID: "",
    warehouseCode: "",
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    areTokensValid()
  );

  const getMe = async () => {
    const account = await fetchUserProfile();
    setUserProfile({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
      warehouseID: account.warehouse?.warehouseID || "",
      warehouseCode: account.warehouse?.warehouseCode || "",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        setUserProfile,
        isAuthenticated,
        setIsAuthenticated,
        getMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
