export type UserData = {
  userId: string;
  username: string;
  email: string;
  role: string;
};

export const getUserData = (): UserData | null => {
  const raw = localStorage.getItem("user_data");
  return raw ? JSON.parse(raw) : null;
};
