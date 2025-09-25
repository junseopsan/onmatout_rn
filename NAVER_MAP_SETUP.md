# 네이버 지도 설정 가이드

## 1. 네이버 클라우드 플랫폼에서 API 키 발급

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/)에 접속
2. 회원가입 또는 로그인
3. **AI Services** > **Maps** 선택
4. **Maps API** 활성화
5. **Client ID** 발급

## 2. Android 설정

`android/app/src/main/AndroidManifest.xml` 파일에서 `YOUR_CLIENT_ID_HERE`를 실제 클라이언트 ID로 교체:

```xml
<meta-data
  android:name="com.naver.maps.map.CLIENT_ID"
  android:value="실제_클라이언트_ID" />
```

## 3. iOS 설정

`ios/onmatoutrn/Info.plist` 파일에서 `YOUR_CLIENT_ID_HERE`를 실제 클라이언트 ID로 교체:

```xml
<key>NMFClientId</key>
<string>실제_클라이언트_ID</string>
```

## 4. 앱 빌드 및 테스트

### Android

```bash
npx expo run:android
```

### iOS

```bash
npx expo run:ios
```

## 5. 주의사항

- API 키는 절대 공개 저장소에 커밋하지 마세요
- 개발용과 프로덕션용 API 키를 분리하여 사용하세요
- API 사용량 제한을 확인하세요

## 6. 문제 해결

### 지도가 표시되지 않는 경우

1. API 키가 올바르게 설정되었는지 확인
2. 네트워크 연결 상태 확인
3. 앱을 완전히 재시작

### 빌드 오류가 발생하는 경우

1. `cd ios && pod install` 실행
2. `npx expo run:ios --clear` 실행
