import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="bg-blue-500 text-white p-8 m-4">
      <h1 className="text-4xl font-bold mb-4">Tailwind CSS Test</h1>
      <p className="text-lg">If you can see blue background and white text, Tailwind is working!</p>
      <div className="mt-4 p-4 bg-red-500 rounded-lg">
        <p>This should be red background with rounded corners</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-500 p-4 rounded">Green Box</div>
        <div className="bg-yellow-500 p-4 rounded">Yellow Box</div>
      </div>
    </div>
  );
};

export default TestPage;
