import React from 'react';

const Card = ({ title, children }) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
};

export default Card;