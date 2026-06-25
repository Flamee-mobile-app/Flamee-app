export type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

export type RegisterFormValues = {
  phone: string;
  email: string;
  password: string;
  acceptedPolicy: boolean;
};

export type AuthSession = {
  userId: string;
  displayName: string;
  email: string;
};
