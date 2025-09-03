import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.contentText}>
          온매아웃 (이하 "회사")는 사용자의 개인정보를 소중히 여기며, 「개인정보
          보호법」 등 관련 법령을 준수하고 있습니다. 본 개인정보처리방침은
          회사가 제공하는 **ONMATOUT 모바일 앱**(이하 "서비스") 이용과 관련하여
          사용자의 개인정보가 어떻게 수집, 이용, 보관, 제공되는지를 안내합니다.
        </Text>

        <Text style={styles.sectionTitle}>
          1. 수집하는 개인정보 항목 및 수집 방법
        </Text>
        <Text style={styles.contentText}>
          회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.
        </Text>

        <Text style={styles.subTitle}>회원가입 및 로그인 시</Text>
        <Text style={styles.contentText}>
          • 필수항목: 전화번호, 인증코드{"\n"}• 선택항목: 이름, 닉네임, 프로필
          이미지
        </Text>

        <Text style={styles.subTitle}>
          서비스 이용 과정에서 자동으로 수집되는 정보
        </Text>
        <Text style={styles.contentText}>
          • 단말기 정보(모델명, OS 버전, 기기 식별자){"\n"}• 접속 로그, IP 주소,
          쿠키{"\n"}• 이용 기록(앱 내 기능 사용 내역, 수련 기록 등)
        </Text>

        <Text style={styles.subTitle}>기록 기능 이용 시(선택)</Text>
        <Text style={styles.contentText}>
          • 사용자가 직접 입력한 메모, 감정/상태 기록
        </Text>

        <Text style={styles.sectionTitle}>2. 개인정보의 수집 및 이용 목적</Text>
        <Text style={styles.contentText}>
          회사는 수집한 개인정보를 아래의 목적으로 활용합니다.
        </Text>
        <Text style={styles.contentText}>
          • 서비스 가입 및 본인확인(전화번호 인증){"\n"}• 아사나 기록 및 개인
          맞춤형 통계 제공{"\n"}• 요가원 탐색 등 위치 기반 서비스 제공(선택 동의
          시){"\n"}• 서비스 품질 개선 및 신규 기능 개발{"\n"}• 부정 이용 방지,
          법령 위반 행위 대응{"\n"}• 고객 문의 대응 및 공지사항 전달
        </Text>

        <Text style={styles.sectionTitle}>3. 개인정보의 보유 및 이용 기간</Text>
        <Text style={styles.contentText}>
          • 회원 탈퇴 시 즉시 파기{"\n"}• 단, 법령에서 정한 보존 기간이 있을
          경우 해당 기간 동안 보관 후 파기{"\n"}• 전자상거래법에 따른 거래기록:
          5년{"\n"}• 통신비밀보호법에 따른 접속기록: 3개월
        </Text>

        <Text style={styles.sectionTitle}>4. 개인정보의 제3자 제공</Text>
        <Text style={styles.contentText}>
          회사는 원칙적으로 사용자의 개인정보를 외부에 제공하지 않습니다.{"\n"}
          단, 아래의 경우 예외로 제공합니다.
        </Text>
        <Text style={styles.contentText}>
          • 사용자가 사전에 동의한 경우{"\n"}• 법령에 의거하여 수사기관·법원
          등이 요청하는 경우
        </Text>

        <Text style={styles.sectionTitle}>5. 개인정보 처리의 위탁</Text>
        <Text style={styles.contentText}>
          회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁할 수
          있습니다.
        </Text>
        <Text style={styles.contentText}>
          • Supabase Inc.: 인증 및 데이터베이스 관리{"\n"}• NHN Cloud:
          문자·카카오 알림톡 발송{"\n"}• Naver Cloud: 알림 전송
        </Text>

        <Text style={styles.sectionTitle}>6. 이용자의 권리</Text>
        <Text style={styles.contentText}>
          이용자는 언제든지 자신의 개인정보를 조회·수정·삭제할 수 있으며, 회원
          탈퇴를 통해 개인정보 이용에 대한 동의를 철회할 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>7. 개인정보의 파기 절차 및 방법</Text>
        <Text style={styles.contentText}>
          • 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제{"\n"}• 종이 문서:
          분쇄 또는 소각 처리
        </Text>

        <Text style={styles.sectionTitle}>8. 개인정보의 안전성 확보 조치</Text>
        <Text style={styles.contentText}>
          회사는 개인정보를 안전하게 보호하기 위하여 다음과 같은 조치를 취하고
          있습니다.
        </Text>
        <Text style={styles.contentText}>
          • 암호화 통신(SSL/TLS){"\n"}• 비밀번호 없는 전화번호 인증 방식 적용
          {"\n"}• 접근 권한 최소화 및 내부 보안 교육{"\n"}• 주기적 보안 점검 및
          로그 모니터링
        </Text>

        <Text style={styles.sectionTitle}>9. 개인정보 보호책임자</Text>
        <Text style={styles.contentText}>
          • 이름: 박준섭{"\n"}• 직책: 개인정보보호책임자{"\n"}• 이메일:
          dev@onmatout.com{"\n"}• 연락처: 1544-5218
        </Text>

        <Text style={styles.sectionTitle}>10. 개정 사항 고지</Text>
        <Text style={styles.contentText}>
          본 개인정보처리방침은 시행일로부터 적용되며, 내용 추가·삭제·변경이
          있을 경우 앱 내 공지사항 또는 이메일을 통해 고지합니다.
        </Text>

        <Text style={styles.footer}>시행일자: 2025년 8월 27일</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  footer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 32,
    marginBottom: 16,
    fontStyle: "italic",
  },
});
