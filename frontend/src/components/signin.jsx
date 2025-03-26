import { SignIn } from "@clerk/clerk-react";

const SignInPage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
};

export default SignInPage;