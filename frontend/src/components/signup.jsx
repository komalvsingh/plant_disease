import { SignUp } from "@clerk/clerk-react";

const SignUpPage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
};

export default SignUpPage;