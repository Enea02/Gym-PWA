import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: 'admin' | 'user';
    preferredUnit?: 'kg' | 'lbs';
    theme?: 'dark' | 'light';
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'user';
      preferredUnit: 'kg' | 'lbs';
      theme: 'dark' | 'light';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'user';
    preferredUnit: 'kg' | 'lbs';
    theme: 'dark' | 'light';
  }
}
