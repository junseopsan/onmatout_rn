import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "전화번호 입력",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verify"
        options={{
          title: "인증 코드 확인",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="nickname"
        options={{
          title: "닉네임 설정",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
