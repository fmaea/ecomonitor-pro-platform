import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{ padding: '1rem', backgroundColor: '#f0f0f0', textAlign: 'center', marginTop: 'auto' }}>
      <p>&copy; {new Date().getFullYear()} Ecomonitor Pro Training. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
