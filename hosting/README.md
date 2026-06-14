# onmatout.com 유니버설 링크 호스팅

초대 링크 `https://onmatout.com/a/ONM-XXXX` 를 동작시키기 위해 **onmatout.com 도메인**에 올려야 하는 파일들입니다. (앱 코드가 아니라 도메인/호스팅에 배치)

## 1. 파일 배치
| 파일 | 호스팅 경로 | Content-Type |
|---|---|---|
| `.well-known/apple-app-site-association` | `https://onmatout.com/.well-known/apple-app-site-association` | `application/json` |
| `.well-known/assetlinks.json` | `https://onmatout.com/.well-known/assetlinks.json` | `application/json` |
| `a/index.html` | `https://onmatout.com/a/*` (모든 `/a/...` 경로가 이 페이지를 서빙) | `text/html` |

요구사항:
- **HTTPS + 유효한 인증서**, 리다이렉트 없이 직접 200 응답.
- `apple-app-site-association` 은 **확장자 없이**, `application/json` 으로 서빙.
- `/a/ONM-EX7G` 같은 하위 경로가 모두 `a/index.html` 로 가도록 rewrite (예: Vercel `rewrites`, Nginx `try_files`, Netlify `_redirects`).

## 2. assetlinks.json 의 SHA-256 채우기 (Android)
`REPLACE_WITH_YOUR_RELEASE_SHA256_FINGERPRINT` 를 **릴리즈 서명 인증서의 SHA-256 지문**으로 교체하세요.
- EAS 관리 키스토어: `eas credentials` → Android → 해당 프로필 → SHA-256 확인.
- Google Play App Signing 사용 시: Play Console → 앱 → 출시 → 앱 무결성 → 앱 서명 키 인증서의 **SHA-256**.
- (Play App Signing 과 업로드 키가 다르면 **둘 다** 배열에 넣는 게 안전합니다.)

## 3. iOS appID 확인
`apple-app-site-association` 의 `C4BKFBL34U.com.onmatout.app` =
`<Apple Team ID>.<Bundle ID>` 입니다. (현재 app.json 의 appleTeamId=C4BKFBL34U, bundleIdentifier=com.onmatout.app)

## 4. 앱 쪽은 이미 반영됨
- `app.json`: iOS `associatedDomains: ["applinks:onmatout.com"]`, Android `intentFilters`(host onmatout.com, `/a`).
- 딥링크 파서(`AppContainer`)·QR 스캐너(`scan-invite`)가 `https://onmatout.com/a/CODE` 를 파싱해 연결 흐름(AuthMatch)으로 보냄.
- **bare 워크플로라 `npx expo prebuild` 후 새 빌드**가 있어야 네이티브(Entitlements/Manifest)에 반영됩니다.

## 5. 검증
- iOS: 빌드 설치 후 메모/메시지에서 `https://onmatout.com/a/ONM-XXXX` 길게 눌러 "온매트아웃에서 열기" 뜨는지.
- Android: 링크 탭 시 앱으로 바로 열리는지 (`adb shell pm get-app-links com.onmatout.app` 로 검증 상태 확인).
- AASA 점검: https://branch.io/resources/aasa-validator/ 또는 Apple CDN `https://app-site-association.cdn-apple.com/a/v1/onmatout.com`.
