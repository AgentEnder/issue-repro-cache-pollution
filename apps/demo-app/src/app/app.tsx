// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss';

import * as json from 'is-even/package.json';

export function App() {
  return (
    <>
      {json.version}
      <div />
    </>
  );
}

export default App;
