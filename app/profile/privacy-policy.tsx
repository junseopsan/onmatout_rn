import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.contentText}>
          온매트아웃 (이하 &quot;회사&quot;)는 사용자의 개인정보를 소중히 여기며,
          「개인정보 보호법」 및 「위치정보의 보호 및 이용 등에 관한 법률」 등
          관련 법령을 준수합니다. 본 개인정보처리방침은 회사가 제공하는 ONMATOUT
          모바일 앱(이하 &quot;서비스&quot;) 이용과 관련하여 사용자의 개인정보가
          어떻게 수집, 이용, 보관, 제공되는지를 안내합니다. ONMATOUT은 선생님(원장)과
          수련생을 연결하고 요가원의 클래스, 수업권, 예약, 출석을 관리하는 서비스를
          제공합니다.
        </Text>

        <Text style={styles.sectionTitle}>
          1. 수집하는 개인정보 항목 및 수집 방법
        </Text>

        <Text style={styles.subTitle}>회원가입 및 로그인 시</Text>
        <Text style={styles.contentText}>
          • 필수항목: 전화번호, 인증코드{"\n"}• 선택항목: 이름, 닉네임, 프로필
          이미지
        </Text>

        <Text style={styles.subTitle}>요가원 운영(원장/선생님) 이용 시</Text>
        <Text style={styles.contentText}>
          • 요가원 정보: 상호명, 주소, 연락처, 운영시간, 입금 계좌, 소개, 사진 등
          (원장이 직접 입력){"\n"}• 수련생 관리 정보: 선생님(원장)이 등록하는
          수련생의 이름, 전화번호, 메모, 수업권 및 출석 내역 등{"\n"}• 수업권 상품
          정보, 예약 및 출석 기록
        </Text>
        <Text style={styles.contentText}>
          ※ 선생님(원장)이 앱에 가입하지 않은 수련생의 정보를 입력하는 경우,
          입력하는 회원은 해당 정보 주체로부터 적법한 동의를 받았음을 보증해야
          하며, 그 책임은 입력한 회원에게 있습니다.
        </Text>

        <Text style={styles.subTitle}>수련생 이용 시</Text>
        <Text style={styles.contentText}>
          • 연결한 요가원, 보유 수업권, 수업 예약 및 출석 내역{"\n"}• 선생님과
          주고받은 메시지(요가톡) 내용
        </Text>

        <Text style={styles.subTitle}>위치정보(선택)</Text>
        <Text style={styles.contentText}>
          • &quot;근처 선생님/수련생&quot; 연결 기능 이용 시 단말기의 정밀
          위치정보(GPS){"\n"}• &quot;근처에 나를 보이기&quot;에 동의한 경우, 가까운
          이용자에게 대략적인 거리 및 표시 정보가 제공됩니다. 동의는 설정에서
          언제든지 해제할 수 있습니다.
        </Text>

        <Text style={styles.subTitle}>기록 기능 이용 시(선택)</Text>
        <Text style={styles.contentText}>
          • 사용자가 직접 입력한 수련 기록, 메모, 감정/상태 기록, 사진
        </Text>

        <Text style={styles.subTitle}>
          서비스 이용 과정에서 자동으로 수집되는 정보
        </Text>
        <Text style={styles.contentText}>
          • 단말기 정보(모델명, OS 버전, 기기 식별자){"\n"}• 접속 로그, IP 주소
          {"\n"}• 푸시 알림 발송을 위한 기기 토큰{"\n"}• 이용 기록(앱 내 기능 사용
          내역 등)
        </Text>

        <Text style={styles.sectionTitle}>2. 개인정보의 수집 및 이용 목적</Text>
        <Text style={styles.contentText}>
          • 서비스 가입 및 본인확인(전화번호 인증){"\n"}• 선생님-수련생 연결 및
          요가원의 클래스, 수업권, 예약, 출석 관리{"\n"}• 위치 기반 연결 기능
          제공(선택 동의 시){"\n"}• 요가톡 메시지 송수신{"\n"}• 수련 기록 및 개인
          맞춤형 통계 제공{"\n"}• 푸시 알림 및 공지사항 전달{"\n"}• 서비스 품질
          개선 및 신규 기능 개발{"\n"}• 부정 이용 방지, 법령 위반 행위 대응{"\n"}•
          고객 문의 대응
        </Text>

        <Text style={styles.sectionTitle}>3. 개인정보의 보유 및 이용 기간</Text>
        <Text style={styles.contentText}>
          • 회원 탈퇴 시 즉시 파기{"\n"}• 단, 법령에서 정한 보존 기간이 있을 경우
          해당 기간 동안 보관 후 파기{"\n"}• 전자상거래법에 따른 거래기록: 5년
          {"\n"}• 통신비밀보호법에 따른 접속기록: 3개월{"\n"}• 위치정보는 연결
          기능 제공 목적 달성 후 지체 없이 파기합니다.
        </Text>

        <Text style={styles.sectionTitle}>
          4. 개인정보의 제3자 제공 및 공유
        </Text>
        <Text style={styles.contentText}>
          회사는 원칙적으로 사용자의 개인정보를 외부에 제공하지 않습니다. 다만
          서비스의 성격상 아래의 경우 정보가 공유됩니다.
        </Text>
        <Text style={styles.contentText}>
          • 수련생이 특정 요가원에 연결(가입)하는 경우, 해당 요가원의
          운영자(원장/선생님)에게 수련생의 이름, 연락처, 수업권, 예약 및 출석
          정보가 제공됩니다.{"\n"}• 사용자가 사전에 동의한 경우{"\n"}• 법령에
          의거하여 수사기관, 법원 등이 요청하는 경우
        </Text>

        <Text style={styles.sectionTitle}>5. 개인정보 처리의 위탁</Text>
        <Text style={styles.contentText}>
          회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁할 수
          있습니다.
        </Text>
        <Text style={styles.contentText}>
          • Supabase Inc.: 인증, 데이터베이스 및 이미지 저장소 관리{"\n"}• Expo
          (Expo Push): 푸시 알림 발송
        </Text>

        <Text style={styles.sectionTitle}>6. 위치정보의 처리</Text>
        <Text style={styles.contentText}>
          1. 회사는 &quot;근처 선생님/수련생&quot; 연결 기능을 위해 이용자가 동의한
          경우에만 위치정보를 수집·이용합니다.{"\n"}
          2. 이용자는 단말기 설정 또는 앱 내 설정에서 위치 권한 및 &quot;근처에
          나를 보이기&quot;를 언제든지 해제할 수 있습니다.{"\n"}
          3. 위치정보는 연결 목적 외의 용도로 이용되지 않으며, 목적 달성 후 지체
          없이 파기됩니다.
        </Text>

        <Text style={styles.sectionTitle}>7. 이용자의 권리</Text>
        <Text style={styles.contentText}>
          이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며, 회원
          탈퇴를 통해 개인정보 이용에 대한 동의를 철회할 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>8. 개인정보의 파기 절차 및 방법</Text>
        <Text style={styles.contentText}>
          • 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제{"\n"}• 종이 문서:
          분쇄 또는 소각 처리
        </Text>

        <Text style={styles.sectionTitle}>9. 개인정보의 안전성 확보 조치</Text>
        <Text style={styles.contentText}>
          • 암호화 통신(SSL/TLS){"\n"}• 비밀번호 없는 전화번호 인증 방식 적용
          {"\n"}• 데이터 접근 권한 최소화 및 내부 보안 관리{"\n"}• 주기적 보안
          점검 및 로그 모니터링
        </Text>

        <Text style={styles.sectionTitle}>10. 개인정보 보호책임자</Text>
        <Text style={styles.contentText}>
          • 이름: 박준섭{"\n"}• 직책: 개인정보보호책임자{"\n"}• 이메일:
          service@onmatout.com{"\n"}• 연락처: 1544-5218
        </Text>

        <Text style={styles.sectionTitle}>11. 개정 사항 고지</Text>
        <Text style={styles.contentText}>
          본 개인정보처리방침은 시행일로부터 적용되며, 내용 추가, 삭제, 변경이
          있을 경우 앱 내 공지사항 또는 이메일을 통해 고지합니다.
        </Text>

        <Text style={styles.footer}>시행일자: 2026년 6월 11일</Text>
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
