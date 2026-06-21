import React from 'react';
import { Game } from './components/Game';
import { UI } from './components/UI';

const App = () => {
  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      <Game />
      <UI />
    </div>
  );
};

export default App;