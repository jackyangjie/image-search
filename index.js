import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';
import App from './App';

// 在 Web 平台上禁用原生 screens
if (typeof window !== 'undefined') {
  // Web 平台，禁用 screens
  enableScreens(false);
} else {
  // 原生平台，启用 screens
  enableScreens(true);
}

// 注册根组件
registerRootComponent(App);
