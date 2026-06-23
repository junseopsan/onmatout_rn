// 역할별 루트 네비게이터 reset 경로 (단일 진실 소스).
// 선생님 탭은 reset 시 이전 탭(예: 수련생) 상태가 남아 initialRouteName 이 무시되는 일을
// 막기 위해, 클래스 탭으로 진입하도록 중첩 상태를 명시한다.
export function roleRootRoutes(isTeacher: boolean): any[] {
  return isTeacher
    ? [
        {
          name: "TeacherTabNavigator",
          state: { index: 0, routes: [{ name: "TeacherClassesTab" }] },
        },
      ]
    : [
        {
          name: "TabNavigator",
          state: { index: 0, routes: [{ name: "Classes" }] },
        },
      ];
}
