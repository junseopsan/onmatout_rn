# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# onmatout_rn 123

# onmatout android apk file build

"gradleCommand": ":app:assembleRelease"

## Google 서비스 계정 키 관리

- `onmatout-c61ec9ef597f.json`과 같은 서비스 계정 키 파일을 리포에 두지 마세요.
- 로컬 `.env` (커밋 금지)에 아래 형태로 저장해 사용하세요:
  - `GOOGLE_SERVICE_ACCOUNT_TYPE=service_account`
  - `GOOGLE_SERVICE_ACCOUNT_PROJECT_ID=onmatout`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=<your_private_key_id>`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<your_private_key>\n-----END PRIVATE KEY-----\n"`
  - `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=onmatout@onmatout.iam.gserviceaccount.com`
  - `GOOGLE_SERVICE_ACCOUNT_CLIENT_ID=<your_client_id>`
  - `GOOGLE_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth`
  - `GOOGLE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token`
  - `GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs`
  - `GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/onmatout%40onmatout.iam.gserviceaccount.com`
  - `GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN=googleapis.com`
- 필요한 경우 코드에서 `process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` 등으로 읽어서 사용하세요. (서비스 계정 키는 클라이언트/모바일 빌드에 포함하지 마세요.)
