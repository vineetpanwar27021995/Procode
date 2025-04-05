import React from "react";

function PrivacyPolicy() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">
        Procode is committed to protecting your privacy. This policy outlines how we collect,
        use, and protect your information when you use our platform.
      </p>
      <h2 className="text-xl font-semibold mt-6">Information Collection</h2>
      <p className="mb-4">
        We may collect your name, email address, and usage data to personalize your
        learning experience and improve our services.
      </p>
      <h2 className="text-xl font-semibold mt-6">Usage of Data</h2>
      <p className="mb-4">
        Your data is used solely for improving the platform experience and will never be
        sold or shared without consent.
      </p>
      <h2 className="text-xl font-semibold mt-6">Third-Party Services</h2>
      <p className="mb-4">
        We use services like Firebase, Google, and Facebook for login and authentication.
        These services may collect user data under their own privacy policies.
      </p>
      <h2 className="text-xl font-semibold mt-6">Contact Us</h2>
      <p>If you have questions, contact us at <a className="text-blue-600" href="mailto:support@procode.com">support@procode.com</a>.</p>
    </div>
  );
}

export default PrivacyPolicy;
