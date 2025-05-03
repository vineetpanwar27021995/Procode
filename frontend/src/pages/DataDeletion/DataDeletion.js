import React from "react";

function DataDeletion() {
    return (
        <div className="h-screen w-full">
            <div className="p-8 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Data Deletion Instructions</h1>
                <p className="mb-4">
                If you wish to delete your Procode account and all associated data, please follow these steps:
                </p>
                <ol className="list-decimal pl-6 mb-4">
                <li>Send an email to <a className="text-blue-600" href="mailto:procodecustomer@gmail.com">procodecustomer@gmail.com</a></li>
                <li>Include your registered email ID and request for data deletion</li>
                <li>We will process your request within 5-7 business days</li>
                </ol>
                <p className="mb-4">For urgent issues, you can also contact us through the chat support on our app.</p>
            </div>
        </div>
    );
  }

  export default DataDeletion;
