import { APP_ROUTES } from './routes';

export type AppRouteName = keyof typeof APP_ROUTES;

export type RootStackParamList = {
  [Key in AppRouteName]: undefined;
};

export type AppScreenContract = {
  name: AppRouteName;
  label: string;
  description: string;
};