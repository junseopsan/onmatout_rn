// 역할별 루트 네비게이터 reset 경로 (단일 진실 소스).
// reset 시 이전 탭 상태가 남아 initialRouteName 이 무시되는 일을 막기 위해,
// 진입 탭을 중첩 상태로 명시한다.
//   - teacher: 선생님 클래스 탭
//   - student: 수련생 클래스 탭 (로그인 필요)
//   - guest:   비로그인 — 클래스는 로그인이 필요하므로 브라우징 가능한 기본(아사나)
export type RoleRootMode = "teacher" | "student" | "guest";

export function roleRootRoutes(mode: RoleRootMode): any[] {
  if (mode === "teacher") {
    return [
      {
        name: "TeacherTabNavigator",
        state: { index: 0, routes: [{ name: "TeacherClassesTab" }] },
      },
    ];
  }
  if (mode === "student") {
    return [
      {
        name: "TabNavigator",
        state: { index: 0, routes: [{ name: "Classes" }] },
      },
    ];
  }
  // guest — 비로그인: initialRouteName(아사나)로 진입
  return [{ name: "TabNavigator" }];
}
