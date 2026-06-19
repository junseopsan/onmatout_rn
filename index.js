import { registerRootComponent } from "expo";
import * as SplashScreen from "expo-splash-screen";
import App from "./app/index";

// 네이티브 스플래시를 JS/폰트 로딩이 끝날 때까지 유지 (로딩 중 검정 화면 노출 방지).
// 숨김은 app/_layout.tsx 의 폰트 로딩 완료 시점에 hideAsync() 로 처리.
SplashScreen.preventAutoHideAsync().catch(() => {});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
