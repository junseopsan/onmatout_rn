import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Colors";

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>이용약관</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>제1조 (목적)</Text>
        <Text style={styles.contentText}>
          이 약관은 ONMATOUT(이하 "회사")이 제공하는 요가 수련 기록 서비스(이하 "서비스")의 
          이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 
          규정함을 목적으로 합니다.
        </Text>

        <Text style={styles.sectionTitle}>제2조 (정의)</Text>
        <Text style={styles.contentText}>
          1. "서비스"라 함은 회사가 제공하는 요가 수련 기록 및 관리 서비스를 의미합니다.{'\n'}
          2. "회원"이라 함은 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 
          체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.{'\n'}
          3. "계정"이라 함은 회원의 식별과 회원의 서비스 이용을 위하여 사용되는 
          고유한 정보를 의미합니다.
        </Text>

        <Text style={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</Text>
        <Text style={styles.contentText}>
          1. 이 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.{'\n'}
          2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.{'\n'}
          3. 약관이 변경되는 경우, 회사는 변경사항을 시행일자 7일 전부터 공지사항을 통해 
          공지합니다.{'\n'}
          4. 회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제4조 (서비스의 제공)</Text>
        <Text style={styles.contentText}>
          1. 회사는 다음과 같은 서비스를 제공합니다:{'\n'}
          • 요가 수련 기록 및 관리{'\n'}
          • 수련 통계 및 분석{'\n'}
          • 아사나 정보 제공{'\n'}
          • 기타 회사가 정하는 서비스{'\n'}
          2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.{'\n'}
          3. 회사는 서비스의 제공에 필요한 경우 정기점검을 실시할 수 있으며, 
          정기점검시간은 서비스제공화면에 공지한 바에 따릅니다.
        </Text>

        <Text style={styles.sectionTitle}>제5조 (서비스의 중단)</Text>
        <Text style={styles.contentText}>
          1. 회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 
          통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 
          일시적으로 중단할 수 있습니다.{'\n'}
          2. 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 
          회원 또는 제3자가 입은 손해에 대하여 배상하지 아니합니다.
        </Text>

        <Text style={styles.sectionTitle}>제6조 (회원가입)</Text>
        <Text style={styles.contentText}>
          1. 회원은 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 
          이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.{'\n'}
          2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 
          다음 각호에 해당하지 않는 한 회원으로 등록합니다.{'\n'}
          • 가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우{'\n'}
          • 등록 내용에 허위, 기재누락, 오기가 있는 경우{'\n'}
          • 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우
        </Text>

        <Text style={styles.sectionTitle}>제7조 (회원탈퇴 및 자격 상실)</Text>
        <Text style={styles.contentText}>
          1. 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.{'\n'}
          2. 회원이 다음 각호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.{'\n'}
          • 가입 신청 시에 허위 내용을 등록한 경우{'\n'}
          • 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 
          전자상거래 질서를 위협하는 경우{'\n'}
          • 서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우
        </Text>

        <Text style={styles.sectionTitle}>제8조 (회원의 의무)</Text>
        <Text style={styles.contentText}>
          1. 회원은 다음 행위를 하여서는 안됩니다.{'\n'}
          • 신청 또는 변경 시 허위내용의 등록{'\n'}
          • 타인의 정보 도용{'\n'}
          • 회사가 게시한 정보의 변경{'\n'}
          • 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시{'\n'}
          • 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해{'\n'}
          • 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위{'\n'}
          • 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 
          서비스에 공개 또는 게시하는 행위
        </Text>

        <Text style={styles.sectionTitle}>제9조 (회사의 의무)</Text>
        <Text style={styles.contentText}>
          1. 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 
          이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 
          최선을 다하여야 합니다.{'\n'}
          2. 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 
          개인정보(신용정보 포함) 보호를 위한 보안 시스템을 구축합니다.{'\n'}
          3. 회사는 서비스이용과 관련하여 이용자로부터 제기된 의견이나 불만이 
          정당하다고 객관적으로 인정될 경우에는 적절한 절차를 거쳐 즉시 처리하여야 합니다.
        </Text>

        <Text style={styles.sectionTitle}>제10조 (개인정보보호)</Text>
        <Text style={styles.contentText}>
          1. 회사는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 
          이를 준수합니다.{'\n'}
          2. 개인정보의 수집, 이용, 제공, 위탁, 파기 등에 관한 자세한 내용은 
          개인정보처리방침에서 정합니다.
        </Text>

        <Text style={styles.sectionTitle}>제11조 (분쟁해결)</Text>
        <Text style={styles.contentText}>
          1. 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 
          보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.{'\n'}
          2. 회사와 이용자 간에 발생한 전자상거래 분쟁에 대하여는 
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
});
