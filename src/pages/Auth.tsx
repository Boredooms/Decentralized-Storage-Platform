import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

interface AuthProps {
  redirectAfterAuth?: string;
}

export default function AuthPage({ redirectAfterAuth = '/dashboard' }: AuthProps) {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isSignUp = location.pathname === '/sign-up';

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate(redirectAfterAuth);
    }
  }, [isLoaded, isSignedIn, navigate, redirectAfterAuth]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="./logo.svg"
              alt="Destore Logo"
              width={64}
              height={64}
              className="rounded-lg cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          
          {/* Clerk Authentication Component */}
          <div className="flex justify-center">
            {isSignUp ? (
              <SignUp 
                afterSignUpUrl={redirectAfterAuth}
                redirectUrl={redirectAfterAuth}
                signInUrl="/sign-in"
              />
            ) : (
              <SignIn 
                afterSignInUrl={redirectAfterAuth}
                redirectUrl={redirectAfterAuth}
                signUpUrl="/sign-up"
              />
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Secured by{" "}
              <a
                href="https://vly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                vly.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
