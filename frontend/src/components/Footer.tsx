import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Credential Proxy. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 