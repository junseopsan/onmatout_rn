// 약관·정책 전용 경량 마크다운 렌더러 (RN, 의존성 없음).
// 지원 문법(우리 문서가 쓰는 부분집합): ## 제목, ### 소제목, - 불릿,
// 빈 줄 = 문단 구분, ※ 로 시작하는 문단은 흐린 주석.
// 번호줄(1. )은 리터럴 그대로 문단 렌더(불릿과 섞여도 번호가 어긋나지 않게).

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/Colors";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "p"; text: string };

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let ul: string[] | null = null;
  const flush = () => {
    if (ul) {
      blocks.push({ type: "ul", items: ul });
      ul = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3) });
    } else if (line.startsWith("- ")) {
      if (!ul) ul = [];
      ul.push(line.slice(2));
    } else {
      flush();
      blocks.push({ type: "p", text: line });
    }
  }
  flush();
  return blocks;
}

export function LegalMarkdown({ body }: { body: string }) {
  const blocks = parse(body);
  return (
    <View>
      {blocks.map((b, i) => {
        if (b.type === "h2")
          return (
            <Text key={i} style={styles.h2}>
              {b.text}
            </Text>
          );
        if (b.type === "h3")
          return (
            <Text key={i} style={styles.h3}>
              {b.text}
            </Text>
          );
        if (b.type === "ul")
          return (
            <View key={i} style={styles.ul}>
              {b.items.map((it, j) => (
                <View key={j} style={styles.li}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.liText}>{it}</Text>
                </View>
              ))}
            </View>
          );
        const muted = b.text.startsWith("※");
        return (
          <Text key={i} style={muted ? styles.pMuted : styles.p}>
            {b.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  h2: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  p: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  pMuted: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.8,
  },
  ul: {
    marginBottom: 12,
  },
  li: {
    flexDirection: "row",
    marginBottom: 6,
    paddingRight: 8,
  },
  bullet: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginRight: 8,
  },
  liText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
});
