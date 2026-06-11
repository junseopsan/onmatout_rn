import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>제1조 (목적)</Text>
        <Text style={styles.contentText}>
          이 약관은 ONMATOUT(이하 &apos;회사&apos;)이 제공하는 요가 수련 기록 및
          요가원 운영·연결 서비스(이하 &apos;서비스&apos;)의 이용과 관련하여 회사와
          회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
          합니다.
        </Text>

        <Text style={styles.sectionTitle}>제2조 (정의)</Text>
        <Text style={styles.contentText}>
          1. &quot;서비스&quot;라 함은 회사가 제공하는 요가 수련 기록 및 요가원의
          클래스, 수업권, 예약, 출석 관리와 선생님-수련생 연결 서비스를
          의미합니다.{"\n"}
          2. &quot;회원&quot;이라 함은 이 약관에 동의하고 회사와 이용계약을 체결한
          이용자를 말합니다.{"\n"}
          3. &quot;원장&quot;이라 함은 요가원을 등록하여 운영하는 회원을, &quot;선생님&quot;이라
          함은 요가원에 소속되어 수련생 관리를 돕는 회원을, &quot;수련생&quot;이라 함은
          요가원에 연결하여 수업을 이용하는 회원을 의미합니다.{"\n"}
          4. &quot;요가원&quot;이라 함은 원장이 등록한 운영 단위를, &quot;수업권&quot;이라 함은
          요가원이 발급하는 수업 이용권을 의미합니다.
        </Text>

        <Text style={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</Text>
        <Text style={styles.contentText}>
          1. 이 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 효력을
          발생합니다.{"\n"}
          2. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며,
          변경 시 시행일자 7일 전부터 앱 내 공지를 통해 안내합니다.{"\n"}
          3. 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할
          수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제4조 (서비스의 제공)</Text>
        <Text style={styles.contentText}>
          1. 회사는 다음과 같은 서비스를 제공합니다:{"\n"}• 요가 수련 기록, 통계
          및 아사나 정보 제공{"\n"}• 요가원 등록 및 운영 관리(클래스, 수업권,
          예약, 출석){"\n"}• QR/링크/위치 기반 선생님-수련생 연결{"\n"}• 선생님과
          수련생 간 메시지(요가톡){"\n"}• 기타 회사가 정하는 서비스{"\n"}
          2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.{"\n"}
          3. 회사는 서비스 제공에 필요한 경우 정기점검을 실시할 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제5조 (서비스의 중단)</Text>
        <Text style={styles.contentText}>
          1. 회사는 설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한
          경우 서비스 제공을 일시적으로 중단할 수 있습니다.{"\n"}
          2. 회사는 제1항의 사유로 인한 일시적 중단으로 회원 또는 제3자가 입은
          손해에 대하여 고의 또는 중대한 과실이 없는 한 배상하지 아니합니다.
        </Text>

        <Text style={styles.sectionTitle}>제6조 (회원가입)</Text>
        <Text style={styles.contentText}>
          1. 회원은 회사가 정한 양식에 따라 정보를 기입하고 이 약관에 동의함으로써
          회원가입을 신청합니다.{"\n"}
          2. 회사는 다음 각호에 해당하지 않는 한 회원으로 등록합니다.{"\n"}•
          가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우
          {"\n"}• 등록 내용에 허위, 기재누락, 오기가 있는 경우{"\n"}• 기타
          회원으로 등록하는 것이 기술상 현저히 지장이 있다고 판단되는 경우
        </Text>

        <Text style={styles.sectionTitle}>
          제7조 (역할 및 요가원 운영)
        </Text>
        <Text style={styles.contentText}>
          1. 회원은 수련생 역할을 기본으로 하며, 신청을 통해 선생님 역할을 추가할
          수 있습니다.{"\n"}
          2. 원장은 요가원을 등록하고 클래스, 수업권, 예약, 출석 정책을 직접
          설정·운영하며, 등록한 수련생 정보를 적법하게 관리할 책임이 있습니다.
          {"\n"}
          3. 회사는 요가원과 수련생을 연결하는 플랫폼을 제공할 뿐이며, 요가원과
          수련생 간의 수업권 거래, 예약, 환불, 보강, 위약 등에 관한 책임은 해당
          당사자에게 있습니다.{"\n"}
          4. 수업권 결제 등 금전 거래는 회사가 제공하지 않으며 외부 수단을 통해
          이루어집니다. 회사는 해당 거래의 당사자가 아닙니다.
        </Text>

        <Text style={styles.sectionTitle}>제8조 (회원탈퇴 및 자격 상실)</Text>
        <Text style={styles.contentText}>
          1. 회원은 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 처리합니다.{"\n"}
          2. 회원이 다음 각호에 해당하는 경우 회사는 회원자격을 제한 또는 정지할
          수 있습니다.{"\n"}• 가입 신청 시 허위 내용을 등록한 경우{"\n"}• 다른
          사람의 서비스 이용을 방해하거나 정보를 도용하는 경우{"\n"}• 법령 또는 이
          약관이 금지하거나 공서양속에 반하는 행위를 하는 경우
        </Text>

        <Text style={styles.sectionTitle}>제9조 (회원의 의무)</Text>
        <Text style={styles.contentText}>
          회원은 다음 행위를 하여서는 안 됩니다.{"\n"}• 신청 또는 변경 시 허위내용
          등록{"\n"}• 타인의 정보 도용 또는 정당한 동의 없이 타인의 개인정보를
          등록·이용하는 행위{"\n"}• 위치정보 및 메시지 기능의 오·남용{"\n"}• 회사
          또는 제3자의 저작권 등 지적재산권 침해{"\n"}• 회사 또는 제3자의 명예를
          손상시키거나 업무를 방해하는 행위{"\n"}• 외설·폭력적이거나 공서양속에
          반하는 정보를 게시하는 행위
        </Text>

        <Text style={styles.sectionTitle}>제10조 (회사의 의무)</Text>
        <Text style={styles.contentText}>
          1. 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지
          않으며, 지속적이고 안정적으로 서비스를 제공하기 위해 최선을 다합니다.
          {"\n"}
          2. 회사는 이용자의 개인정보 보호를 위한 보안 시스템을 구축·운영합니다.
          {"\n"}
          3. 회사는 이용자로부터 제기된 정당한 의견이나 불만을 적절한 절차를 거쳐
          처리합니다.
        </Text>

        <Text style={styles.sectionTitle}>제11조 (개인정보보호)</Text>
        <Text style={styles.contentText}>
          1. 회사는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고
          이를 준수합니다.{"\n"}
          2. 개인정보의 수집, 이용, 제공, 위탁, 파기 등에 관한 자세한 내용은
          개인정보처리방침에서 정합니다.
        </Text>

        <Text style={styles.sectionTitle}>제12조 (책임의 제한)</Text>
        <Text style={styles.contentText}>
          1. 회사는 요가원과 수련생 사이에 발생한 수업권 거래, 예약, 환불, 수업
          품질 등에 관한 분쟁에 대하여 책임을 지지 않습니다.{"\n"}
          2. 회사는 회원이 게시하거나 입력한 정보의 정확성·적법성에 대하여 책임을
          지지 않으며, 그 책임은 해당 정보를 게시·입력한 회원에게 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제13조 (분쟁해결)</Text>
        <Text style={styles.contentText}>
          1. 회사는 이용자가 제기하는 정당한 의견이나 불만을 처리하기 위하여
          노력합니다.{"\n"}
          2. 회사와 이용자 간 발생한 분쟁에 대하여는 관련 법령 및
          소비자분쟁조정위원회의 조정에 따를 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>부칙</Text>
        <Text style={styles.contentText}>
          이 약관은 2024년 1월 1일부터 적용됩니다.
        </Text>
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
    paddingTop: 6,
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
});
