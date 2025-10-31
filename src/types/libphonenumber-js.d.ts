declare module 'libphonenumber-js' {
  export interface PhoneNumber {
    isValid(): boolean;
  }

  export function parsePhoneNumberFromString(phoneNumber: string): PhoneNumber | undefined;
}


