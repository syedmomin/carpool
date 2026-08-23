import { registerRootComponent } from 'expo';
import { patchStyleSheetWithInter } from './src/utils/globalFontPatch';
import './src/tasks/locationTask'; // Registers the background task

// Must run before `./App` (and everything it imports — AppNavigator and every
// screen) is loaded, since each screen calls StyleSheet.create at module-load
// time. A static `import App from './App'` would be hoisted above this call
// regardless of source order, so `App` is loaded via a dynamic require()
// instead, which runs exactly where it's written.
patchStyleSheetWithInter();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const App = require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
