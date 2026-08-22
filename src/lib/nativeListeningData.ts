// Genuinely native-language listening content (not translated from the English tests).
// Proof of concept for "har til o'z haqiqiy formatida" — one test per format so far.
import type { ListeningTest } from "@/lib/listeningData";

export const NATIVE_LISTENING_TESTS: Partial<Record<string, ListeningTest>> = {
  korean: {
    id: "topik_library",
    title: "도서관 이용 안내 (Library Usage Guide)",
    sentences: [
      "안녕하세요. 도서관 이용 방법에 대해 안내해 드리겠습니다.",
      "먼저 책을 빌리시려면 학생증이 필요합니다.",
      "학생증이 없으면 어떻게 하나요?",
      "학생증이 없으신 분은 프런트에서 임시 카드를 발급받으실 수 있습니다.",
      "알겠습니다. 그럼 책은 몇 권까지 빌릴 수 있나요?",
      "한 번에 다섯 권까지 빌리실 수 있고, 대출 기간은 이 주일입니다.",
      "반납일을 넘기면 어떻게 되나요?",
      "하루에 백 원씩 연체료가 부과됩니다.",
      "그리고 도서관은 평일에는 아침 아홉 시부터 밤 열 시까지, 주말에는 오후 여섯 시까지 운영됩니다.",
      "스터디룸도 예약할 수 있나요?",
      "네, 스터디룸은 인터넷 홈페이지를 통해 미리 예약하셔야 하고, 한 번에 최대 세 시간까지 이용 가능합니다.",
    ],
    transcriptHtml:
      `<p class="mb-2"><strong class="text-amber-500 font-mono">[1부]</strong> 안녕하세요. 도서관 이용 방법에 대해 안내해 드리겠습니다. 먼저 책을 빌리시려면 학생증이 필요합니다. 학생증이 없으면 어떻게 하나요? 학생증이 없으신 분은 <mark class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">프런트에서 임시 카드를 발급</mark>받으실 수 있습니다 (Q1). 그럼 책은 몇 권까지 빌릴 수 있나요? 한 번에 <mark class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">다섯 권</mark>까지 빌리실 수 있고 (Q2), 대출 기간은 <mark class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">이 주일</mark>입니다 (Q3).</p>` +
      `<p><strong class="text-amber-500 font-mono">[2부]</strong> 반납일을 넘기면 하루에 백 원씩 연체료가 부과됩니다. 도서관은 평일에는 아침 아홉 시부터 밤 열 시까지, <mark class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">주말에는 오후 여섯 시까지</mark> 운영됩니다 (Q4). 스터디룸은 <mark class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">인터넷 홈페이지를 통해 미리 예약</mark>하셔야 합니다 (Q5).</p>`,
    vocab: [
      { word: "임시 카드 (temporary card)", definition: "학생증이 없을 때 대신 사용하는 카드", translation: "Vaqtinchalik karta" },
      { word: "연체료 (late fee)", definition: "반납일을 넘겼을 때 내는 요금", translation: "Kechikish jarimasi" },
      { word: "대출 기간 (loan period)", definition: "책을 빌릴 수 있는 기간", translation: "Ijaraga olish muddati" },
      { word: "스터디룸 (study room)", definition: "공부를 위해 예약하는 방", translation: "O'quv xonasi" },
    ],
    questions: [
      { qid: "q1", kind: "mcq", prompt: "학생증이 없는 사람은 어떻게 해야 하는가?", options: [{ value: "A", label: "도서관을 이용할 수 없다" }, { value: "B", label: "프런트에서 임시 카드를 발급받는다" }, { value: "C", label: "인터넷으로 신청한다" }], answer_key: "B" },
      { qid: "q2", kind: "mcq", prompt: "책은 한 번에 몇 권까지 빌릴 수 있는가?", options: [{ value: "A", label: "3권" }, { value: "B", label: "5권" }, { value: "C", label: "7권" }], answer_key: "B" },
      { qid: "q3", kind: "mcq", prompt: "대출 기간은 얼마인가?", options: [{ value: "A", label: "1주일" }, { value: "B", label: "2주일" }, { value: "C", label: "3주일" }], answer_key: "B" },
      { qid: "q4", kind: "mcq", prompt: "주말 도서관 운영 시간으로 맞는 것은?", options: [{ value: "A", label: "오전 9시 ~ 오후 10시" }, { value: "B", label: "오전 9시 ~ 오후 6시" }, { value: "C", label: "24시간 운영" }], answer_key: "B" },
      { qid: "q5", kind: "mcq", prompt: "스터디룸에 대한 설명으로 맞는 것은?", options: [{ value: "A", label: "예약 없이 바로 이용 가능하다" }, { value: "B", label: "인터넷으로 미리 예약해야 한다" }, { value: "C", label: "학생증이 없어도 이용 가능하다" }], answer_key: "B" },
    ],
  },
};
