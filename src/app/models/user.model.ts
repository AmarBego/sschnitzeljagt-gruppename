export interface User {
  name: string;
  permissions: {
    location: boolean;
    camera: boolean;
  };
  isSetupComplete: boolean;
  createdAt: Date;
  hasSubmittedFinalStats?: boolean;
}

export interface LocationPermissionState {
  granted: boolean;
  message?: string;
}
