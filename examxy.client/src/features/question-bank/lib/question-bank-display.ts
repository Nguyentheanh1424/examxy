import type {
  CreateQuestionRequest,
  Question,
  QuestionVersion,
  RichContentDocument,
  UpdateQuestionRequest,
} from '@/types/question-bank'

export interface DraftImageAttachment {
  id: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  downloadUrl?: string
  altText: string
  caption: string
}

export type StatusTab = 'Active' | 'Archived' | 'All'

export const questionTypeOptions = [
  {
    value: 'SingleChoice',
    label: 'Một đáp án',
    description: 'Học sinh chọn đúng một lựa chọn.',
  },
  {
    value: 'MultipleChoice',
    label: 'Nhiều đáp án',
    description: 'Học sinh có thể chọn nhiều lựa chọn đúng.',
  },
  {
    value: 'TrueFalse',
    label: 'Đúng / Sai',
    description: 'Câu hỏi chỉ có hai khả năng đúng hoặc sai.',
  },
  {
    value: 'Matching',
    label: 'Ghép đôi',
    description: 'Ghép từng vế trái với vế phải tương ứng.',
  },
  {
    value: 'Ordering',
    label: 'Sắp xếp',
    description: 'Sắp xếp các mục theo đúng thứ tự.',
  },
  {
    value: 'MediaBased',
    label: 'Câu hỏi dùng media',
    description: 'Câu hỏi cần đọc hình, âm thanh, video hoặc tài liệu đính kèm.',
  },
] as const

export type QuestionTypeValue = (typeof questionTypeOptions)[number]['value']

export interface MatchingPairDraft {
  left: string
  right: string
}

export interface DraftChoice {
  id: string
  content: RichContentDocument
}

export interface QuestionDraftState {
  stem: RichContentDocument
  questionType: QuestionTypeValue
  explanation: RichContentDocument
  difficulty: string
  estimatedSeconds: string
  choices: DraftChoice[]
  correctChoice: string
  correctChoices: string[]
  trueFalseAnswer: 'true' | 'false'
  matchingPairs: MatchingPairDraft[]
  orderingItems: string[]
  mediaPrompt: string
  imageAttachments: DraftImageAttachment[]
  contentJson: string
  answerKeyJson: string
  tags: string[]
}

export const emptyDraft: QuestionDraftState = {
  stem: createEmptyRichDocument(),
  questionType: 'SingleChoice',
  explanation: createEmptyRichDocument(),
  difficulty: 'Medium',
  estimatedSeconds: '60',
  choices: [
    { id: 'A', content: textToRichDocument('A') },
    { id: 'B', content: textToRichDocument('B') },
  ],
  correctChoice: 'A',
  correctChoices: ['A'],
  trueFalseAnswer: 'true',
  matchingPairs: [
    { left: 'A', right: '1' },
    { left: 'B', right: '2' },
  ],
  orderingItems: ['Bước 1', 'Bước 2'],
  mediaPrompt: '',
  imageAttachments: [],
  contentJson: '{"choices":["A","B"]}',
  answerKeyJson: '"A"',
  tags: [],
}

export function createEmptyRichDocument(): RichContentDocument {
  return {
    schemaVersion: 2,
    blocks: [],
  }
}

export function textToRichDocument(text: string): RichContentDocument {
  const trimmed = text.trim()
  return {
    schemaVersion: 2,
    blocks: trimmed
      ? [{
        type: 'paragraph',
        inline: [{ type: 'text', text: trimmed }],
      }]
      : [],
  }
}

export function richDocumentToPlainText(document: RichContentDocument | undefined): string {
  if (!document?.blocks?.length) return ''

  return document.blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        return block.inline
          ?.map((node) => {
            if (node.type === 'mathInline') return node.latex ? `\\(${node.latex}\\)` : ''
            return node.text ?? node.value ?? ''
          })
          .join('') ?? ''
      }

      if (block.type === 'mathBlock') {
        return block.latex ? `\\[${block.latex}\\]` : ''
      }

      if (block.type === 'image') {
        return [block.altText, block.caption].filter(Boolean).join(' ')
      }

      return ''
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeQuestionType(value: string | undefined): QuestionTypeValue {
  const match = questionTypeOptions.find((option) => option.value.toLowerCase() === value?.toLowerCase())
  return match?.value ?? 'SingleChoice'
}

export function getQuestionTypeLabel(value: string | undefined) {
  return questionTypeOptions.find((option) => option.value === normalizeQuestionType(value))?.label ?? 'Một đáp án'
}

export function getQuestionTypeDescription(value: string | undefined) {
  return questionTypeOptions.find((option) => option.value === normalizeQuestionType(value))?.description ?? ''
}

export function getQuestionTypeGradingLabel(value: string | undefined) {
  const questionType = normalizeQuestionType(value)
  return questionType === 'MediaBased'
    ? 'Chấm thủ công'
    : 'Tự chấm'
}

function getDefaultContentForType(questionType: QuestionTypeValue) {
  switch (questionType) {
    case 'MultipleChoice':
      return {
        choices: ['A', 'B', 'C', 'D'].map((choice, index) => ({
          id: choiceIdForIndex(index),
          content: textToRichDocument(choice),
        })),
        correctChoice: 'A',
        correctChoices: ['A'],
        contentJson: '{"choices":["A","B","C","D"]}',
        answerKeyJson: '["A"]',
      }
    case 'TrueFalse':
      return {
        contentJson: '{"choices":["Đúng","Sai"]}',
        answerKeyJson: 'true',
      }
    case 'Matching':
      return {
        matchingPairs: [
          { left: 'A', right: '1' },
          { left: 'B', right: '2' },
        ],
        contentJson: '{"pairs":[{"left":"A","right":"1"},{"left":"B","right":"2"}]}',
        answerKeyJson: '{"A":"1","B":"2"}',
      }
    case 'Ordering':
      return {
        orderingItems: ['Bước 1', 'Bước 2'],
        contentJson: '{"items":["Bước 1","Bước 2"]}',
        answerKeyJson: '["Bước 1","Bước 2"]',
      }
    case 'MediaBased':
      return {
        contentJson: '{"prompt":""}',
        answerKeyJson: '{}',
      }
    case 'SingleChoice':
    default:
      return {
        choices: ['A', 'B'].map((choice, index) => ({
          id: choiceIdForIndex(index),
          content: textToRichDocument(choice),
        })),
        correctChoice: 'A',
        correctChoices: ['A'],
        contentJson: '{"choices":["A","B"]}',
        answerKeyJson: '"A"',
      }
  }
}

export function applyQuestionTypeDefaults(
  state: QuestionDraftState,
  questionType: QuestionTypeValue,
): QuestionDraftState {
  return {
    ...state,
    ...getDefaultContentForType(questionType),
    questionType,
  }
}

export function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function toCreateRequest(state: QuestionDraftState): CreateQuestionRequest {
  const { answerKeyJson, contentJson } = buildQuestionJson(state)
  const stem = appendImageBlocks(state.stem, state.imageAttachments)
  const stemPlainText = richDocumentToPlainText(stem)
  const explanationPlainText = richDocumentToPlainText(state.explanation)
  const choices = normalizeChoices(state.choices).map((choice) => ({
    id: choice.id,
    text: richDocumentToPlainText(choice.content),
    content: choice.content,
    isCorrect: isCorrectChoice(state, choice.id),
  }))
  const matchingPairs = normalizePairs(state.matchingPairs)
  const leftItems = matchingPairs.map((pair, index) => ({
    id: matchingLeftIdForIndex(index),
    text: pair.left,
    content: textToRichDocument(pair.left),
  }))
  const rightItems = matchingPairs.map((pair, index) => ({
    id: matchingRightIdForIndex(index),
    text: pair.right,
    content: textToRichDocument(pair.right),
  }))
  const orderingItems = normalizeTextItems(state.orderingItems).map((item, index) => ({
    id: orderingIdForIndex(index),
    text: item,
    content: textToRichDocument(item),
  }))
  const media = state.imageAttachments.map((attachment) => ({
    type: 'image',
    attachmentId: attachment.id,
  }))

  return {
    authoringMode: 'Rich',
    stemPlainText,
    stemRichText: `<p>${escapeHtml(stemPlainText)}</p>`,
    stem,
    stemText: stemPlainText,
    questionType: normalizeQuestionType(state.questionType),
    explanationRichText: `<p>${escapeHtml(explanationPlainText)}</p>`,
    explanation: state.explanation,
    difficulty: state.difficulty.trim(),
    estimatedSeconds: Number(state.estimatedSeconds) || 60,
    contentJson,
    answerKeyJson,
    choices,
    leftItems,
    rightItems,
    items: orderingItems,
    media,
    answerKey: buildCanonicalAnswerKey(state, {
      choiceIds: choices.map((choice) => choice.id),
      leftIds: leftItems.map((item) => item.id),
      rightIds: rightItems.map((item) => item.id),
      orderingIds: orderingItems.map((item) => item.id),
    }),
    tags: state.tags,
    attachments: [],
  }
}

function appendImageBlocks(
  document: RichContentDocument,
  imageAttachments: DraftImageAttachment[],
): RichContentDocument {
  return {
    ...document,
    blocks: [
      ...document.blocks,
      ...imageAttachments.map((attachment) => ({
        type: 'image',
        attachmentId: attachment.id,
        altText: attachment.altText,
        caption: attachment.caption,
      })),
    ],
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function choiceIdForIndex(index: number) {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

function matchingLeftIdForIndex(index: number) {
  return `L${index + 1}`
}

function matchingRightIdForIndex(index: number) {
  return `R${index + 1}`
}

function orderingIdForIndex(index: number) {
  return `I${index + 1}`
}

function isCorrectChoice(state: QuestionDraftState, choice: string) {
  const questionType = normalizeQuestionType(state.questionType)
  return questionType === 'MultipleChoice'
    ? state.correctChoices.includes(choice)
    : state.correctChoice === choice
}

function buildCanonicalAnswerKey(
  state: QuestionDraftState,
  ids: {
    choiceIds: string[]
    leftIds: string[]
    rightIds: string[]
    orderingIds: string[]
  },
) {
  const questionType = normalizeQuestionType(state.questionType)

  if (questionType === 'SingleChoice') {
    const choices = normalizeChoices(state.choices)
    const selectedId = choices.some((choice) => choice.id === state.correctChoice)
      ? state.correctChoice
      : choices[0]?.id
    return { correctChoiceIds: selectedId ? [selectedId] : [] }
  }

  if (questionType === 'MultipleChoice') {
    const choiceIds = new Set(normalizeChoices(state.choices).map((choice) => choice.id))
    return {
      correctChoiceIds: state.correctChoices.filter((choiceId) => choiceIds.has(choiceId)),
    }
  }

  if (questionType === 'TrueFalse') {
    return { value: state.trueFalseAnswer === 'true' }
  }

  if (questionType === 'Matching') {
    return {
      matches: ids.leftIds.map((leftId, index) => ({
        leftId,
        rightId: ids.rightIds[index] ?? '',
      })).filter((match) => match.leftId && match.rightId),
    }
  }

  if (questionType === 'Ordering') {
    return { orderedItemIds: ids.orderingIds }
  }

  if (questionType === 'MediaBased') {
    return { gradingMode: 'Manual' }
  }

  return {}
}

export function buildQuestionJson(state: QuestionDraftState) {
  const questionType = normalizeQuestionType(state.questionType)

  switch (questionType) {
    case 'MultipleChoice': {
      const choices = normalizeChoices(state.choices)
      const correctChoices = state.correctChoices.filter((choiceId) => choices.some((choice) => choice.id === choiceId))
      return {
        contentJson: JSON.stringify({ choices: choices.map((choice) => ({ id: choice.id, content: choice.content })) }),
        answerKeyJson: JSON.stringify(correctChoices),
      }
    }
    case 'TrueFalse':
      return {
        contentJson: JSON.stringify({ choices: ['Đúng', 'Sai'] }),
        answerKeyJson: JSON.stringify(state.trueFalseAnswer === 'true'),
      }
    case 'Matching': {
      const pairs = normalizePairs(state.matchingPairs)
      const leftItems = pairs.map((pair, index) => ({
        id: matchingLeftIdForIndex(index),
        content: textToRichDocument(pair.left),
      }))
      const rightItems = pairs.map((pair, index) => ({
        id: matchingRightIdForIndex(index),
        content: textToRichDocument(pair.right),
      }))
      return {
        contentJson: JSON.stringify({ leftItems, rightItems }),
        answerKeyJson: JSON.stringify({
          matches: pairs.map((_, index) => ({
            leftId: matchingLeftIdForIndex(index),
            rightId: matchingRightIdForIndex(index),
          })),
        }),
      }
    }
    case 'Ordering': {
      const items = normalizeTextItems(state.orderingItems)
      const canonicalItems = items.map((item, index) => ({
        id: orderingIdForIndex(index),
        content: textToRichDocument(item),
      }))
      return {
        contentJson: JSON.stringify({ items: canonicalItems }),
        answerKeyJson: JSON.stringify({ orderedItemIds: canonicalItems.map((item) => item.id) }),
      }
    }
    case 'MediaBased':
      return {
        contentJson: JSON.stringify({
          prompt: state.mediaPrompt.trim(),
          media: state.imageAttachments.map((attachment) => ({
            type: 'image',
            attachmentId: attachment.id,
          })),
        }),
        answerKeyJson: '{"gradingMode":"Manual"}',
      }
    case 'SingleChoice':
    default: {
      const choices = normalizeChoices(state.choices)
      const correctChoice = choices.some((choice) => choice.id === state.correctChoice)
        ? state.correctChoice
        : choices[0]?.id ?? ''
      return {
        contentJson: JSON.stringify({ choices: choices.map((choice) => ({ id: choice.id, content: choice.content })) }),
        answerKeyJson: JSON.stringify({ correctChoiceIds: correctChoice ? [correctChoice] : [] }),
      }
    }
  }
}

export function validateQuestionDraft(state: QuestionDraftState): string | null {
  const questionType = normalizeQuestionType(state.questionType)

  if (!richDocumentToPlainText(state.stem)) {
    return 'Vui lòng nhập nội dung câu hỏi.'
  }

  if (Number(state.estimatedSeconds) < 0) {
    return 'Thời gian ước tính không được nhỏ hơn 0 giây.'
  }

  if (questionType === 'SingleChoice') {
    const choices = normalizeChoices(state.choices)
    if (choices.length < 2) {
      return 'Cần ít nhất 2 lựa chọn để tạo câu hỏi.'
    }
    if (!choices.some((choice) => choice.id === state.correctChoice)) {
      return 'Chọn đúng chính xác 1 đáp án.'
    }
  }

  if (questionType === 'MultipleChoice') {
    const choices = normalizeChoices(state.choices)
    if (choices.length < 2) {
      return 'Cần ít nhất 2 lựa chọn để tạo câu hỏi.'
    }
    const choiceIds = new Set(choices.map((choice) => choice.id))
    if (state.correctChoices.filter((choiceId) => choiceIds.has(choiceId)).length === 0) {
      return 'Chọn ít nhất một đáp án đúng trước khi lưu.'
    }
  }

  if (questionType === 'Matching' && normalizePairs(state.matchingPairs).length < 2) {
    return 'Câu hỏi ghép đôi cần ít nhất 2 cặp hoàn chỉnh.'
  }

  if (questionType === 'Ordering' && normalizeTextItems(state.orderingItems).length < 2) {
    return 'Câu hỏi sắp xếp cần ít nhất 2 mục theo thứ tự đúng.'
  }

  if (questionType === 'MediaBased') {
    if (!state.mediaPrompt.trim() && state.imageAttachments.length === 0) {
      return 'Thêm media, link hoặc ảnh đính kèm để học sinh biết cần xem gì.'
    }
  }

  return null
}

function normalizeTextItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean)
}

function normalizeChoices(choices: DraftChoice[]) {
  return choices.filter((choice) => richDocumentToPlainText(choice.content))
}

function normalizePairs(pairs: MatchingPairDraft[]) {
  return pairs
    .map((pair) => ({
      left: pair.left.trim(),
      right: pair.right.trim(),
    }))
    .filter((pair) => pair.left && pair.right)
}

export function toUpdateRequest(question: Question, state: QuestionDraftState): UpdateQuestionRequest {
  return {
    ...toCreateRequest(state),
    status: question.status,
  }
}

export function getCurrentVersion(question: Question): QuestionVersion | undefined {
  return question.versions.find(
    (version) => version.versionNumber === question.currentVersionNumber,
  ) ?? question.versions[0]
}

export function stripParagraphTags(value: string) {
  return value.replace(/<\/?p>/g, '')
}

export function toDraftState(question: Question): QuestionDraftState {
  const currentVersion = getCurrentVersion(question)
  const questionType = normalizeQuestionType(currentVersion?.questionType)
  const parsedContent = parseJsonUnknown(currentVersion?.contentJson)
  const parsedAnswer = parseJsonUnknown(currentVersion?.answerKeyJson)
  const defaults = applyQuestionTypeDefaults(emptyDraft, questionType)
  const richStem = extractStemDocumentFromCanonicalContent(parsedContent)
  const explanation = parseJsonUnknown(currentVersion?.explanationJson)

  return {
    ...defaults,
    stem: richDocumentToPlainText(richStem) ? richStem : textToRichDocument(currentVersion?.stemPlainText ?? ''),
    questionType,
    explanation: isRichContentDocument(explanation)
      ? explanation
      : textToRichDocument(currentVersion?.explanationRichText ? stripParagraphTags(currentVersion.explanationRichText) : ''),
    difficulty: currentVersion?.difficulty ?? 'Medium',
    estimatedSeconds: String(currentVersion?.estimatedSeconds ?? 60),
    contentJson: currentVersion?.contentJson ?? '{}',
    answerKeyJson: currentVersion?.answerKeyJson ?? '{}',
    tags: question.tags,
    imageAttachments: extractImageAttachments(richStem),
    ...draftFieldsFromJson(questionType, parsedContent, parsedAnswer),
  }
}

export function toDraftStateFromCreateRequest(request: Partial<CreateQuestionRequest>): QuestionDraftState {
  const questionType = normalizeQuestionType(request.questionType)
  const defaults = applyQuestionTypeDefaults(emptyDraft, questionType)
  const parsedContent = parseJsonUnknown(request.contentJson)
  const parsedAnswer = parseJsonUnknown(request.answerKeyJson)
  const fieldsFromJson = draftFieldsFromJson(questionType, parsedContent, parsedAnswer)
  const fieldsFromRequest = choiceDraftFieldsFromRequest(questionType, request)
  const richStem = request.stem && isRichContentDocument(request.stem)
    ? request.stem
    : extractStemDocumentFromCanonicalContent(parsedContent)
  const explanation = request.explanation
    ? request.explanation
    : request.explanationRichText
      ? textToRichDocument(stripParagraphTags(request.explanationRichText))
      : createEmptyRichDocument()

  return {
    ...defaults,
    stem: richDocumentToPlainText(richStem) ? richStem : textToRichDocument(request.stemPlainText || request.stemText || ''),
    questionType,
    explanation,
    difficulty: request.difficulty || 'Medium',
    estimatedSeconds: String(request.estimatedSeconds || 60),
    contentJson: request.contentJson || '{}',
    answerKeyJson: request.answerKeyJson || '{}',
    tags: request.tags ?? [],
    imageAttachments: extractImageAttachments(richStem),
    ...fieldsFromJson,
    ...fieldsFromRequest,
  }
}

export function mergeImportedDraft(
  current: QuestionDraftState,
  imported: QuestionDraftState,
): QuestionDraftState {
  const existingImageIds = new Set(current.imageAttachments.map((attachment) => attachment.id))
  const importedImages = imported.imageAttachments.filter((attachment) => !existingImageIds.has(attachment.id))

  return {
    ...current,
    questionType: imported.questionType,
    stem: imported.stem,
    explanation: imported.explanation,
    choices: imported.choices,
    correctChoice: imported.correctChoice,
    correctChoices: imported.correctChoices,
    trueFalseAnswer: imported.trueFalseAnswer,
    matchingPairs: imported.matchingPairs,
    orderingItems: imported.orderingItems,
    mediaPrompt: imported.mediaPrompt,
    imageAttachments: [...current.imageAttachments, ...importedImages],
    contentJson: imported.contentJson,
    answerKeyJson: imported.answerKeyJson,
  }
}

function choiceDraftFieldsFromRequest(
  questionType: QuestionTypeValue,
  request: Partial<CreateQuestionRequest>,
): Partial<QuestionDraftState> {
  if (questionType !== 'SingleChoice' && questionType !== 'MultipleChoice') {
    if (questionType === 'TrueFalse' && typeof request.answerKey?.value === 'boolean') {
      return {
        trueFalseAnswer: request.answerKey.value ? 'true' : 'false',
      }
    }

    if (questionType === 'Matching' && request.leftItems?.length && request.rightItems?.length) {
      const rightById = new Map(request.rightItems.map((item, index) => [
        item.id ?? matchingRightIdForIndex(index),
        (item.text || extractRichDocumentText(item.content)).trim(),
      ]))
      const leftById = new Map(request.leftItems.map((item, index) => [
        item.id ?? matchingLeftIdForIndex(index),
        (item.text || extractRichDocumentText(item.content)).trim(),
      ]))

      return {
        matchingPairs: request.answerKey?.matches
          ?.map((match) => ({
            left: leftById.get(match.leftId) ?? '',
            right: rightById.get(match.rightId) ?? '',
          }))
          .filter((pair) => pair.left || pair.right) ?? emptyDraft.matchingPairs,
      }
    }

    if (questionType === 'Ordering' && request.items?.length) {
      const itemById = new Map(request.items.map((item, index) => [
        item.id ?? orderingIdForIndex(index),
        (item.text || extractRichDocumentText(item.content)).trim(),
      ]))
      const orderedItems = request.answerKey?.orderedItemIds
        ?.map((id) => itemById.get(id))
        .filter((item): item is string => Boolean(item)) ?? []

      return {
        orderingItems: orderedItems.length > 0
          ? orderedItems
          : request.items
            .map((item) => (item.text || extractRichDocumentText(item.content)).trim())
            .filter(Boolean),
      }
    }

    return {}
  }

  const choices = request.choices
    ?.map((choice, index) => ({
      id: choice.id ?? choiceIdForIndex(index),
      content: isRichContentDocument(choice.content)
        ? choice.content
        : textToRichDocument(choice.text ?? ''),
    }))
    .filter((choice) => richDocumentToPlainText(choice.content)) ?? []

  if (choices.length === 0) {
    return {}
  }

  const byId = new Map(
    choices.map((choice) => [choice.id, choice.id]),
  )
  const correctValues = request.answerKey?.correctChoiceIds
    ?.map((id) => byId.get(id))
    .filter((value): value is string => Boolean(value)) ?? []

  return {
    choices,
    correctChoice: correctValues[0] ?? choices[0]?.id ?? '',
    correctChoices: correctValues,
  }
}

function draftFieldsFromJson(
  questionType: QuestionTypeValue,
  content: unknown,
  answer: unknown,
): Partial<QuestionDraftState> {
  if (questionType === 'SingleChoice' || questionType === 'MultipleChoice') {
    const choiceItems = extractChoiceDraftItems(content)
    const choices = choiceItems.length > 0 ? choiceItems : emptyDraft.choices
    const answerIds = extractCorrectChoiceIds(answer)
    const answerValues = answerIds.length > 0
      ? answerIds.filter((id) => choices.some((choice) => choice.id === id))
      : Array.isArray(answer)
        ? answer.map((item) => String(item)).map((value) => choices.find((choice) => richDocumentToPlainText(choice.content) === value)?.id).filter((id): id is string => Boolean(id))
        : [String(answer ?? '')].map((value) => choices.find((choice) => choice.id === value || richDocumentToPlainText(choice.content) === value)?.id).filter((id): id is string => Boolean(id))

    return {
      choices,
      correctChoice: answerValues[0] && choices.some((choice) => choice.id === answerValues[0])
        ? answerValues[0]
        : choices[0]?.id ?? '',
      correctChoices: answerValues.filter((id) => choices.some((choice) => choice.id === id)),
    }
  }

  if (questionType === 'TrueFalse') {
    const value = answer && typeof answer === 'object' && !Array.isArray(answer)
      ? (answer as Record<string, unknown>).value
      : answer
    return {
      trueFalseAnswer: value === false || String(value).toLowerCase() === 'false' ? 'false' : 'true',
    }
  }

  if (questionType === 'Matching') {
    const contentPairs = extractMatchingPairs(content, answer)

    return {
      matchingPairs: contentPairs.length > 0 ? contentPairs : emptyDraft.matchingPairs,
    }
  }

  if (questionType === 'Ordering') {
    const items = extractOrderingItems(content, answer)
    return {
      orderingItems: items.length > 0 ? items : emptyDraft.orderingItems,
    }
  }

  if (questionType === 'MediaBased') {
    return {
      mediaPrompt: extractPrompt(content),
    }
  }

  return {}
}


function extractStringArrayFromObject(value: unknown, key: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const candidate = (value as Record<string, unknown>)[key]
  return Array.isArray(candidate)
    ? candidate.map((item) => String(item)).filter(Boolean)
    : []
}

function extractMatchingPairs(content: unknown, answer: unknown): MatchingPairDraft[] {
  const legacyPairs = extractPairs(content)
  if (legacyPairs.length > 0) {
    return legacyPairs
  }

  const leftItems = extractContentItems(content, 'leftItems')
  const rightItems = extractContentItems(content, 'rightItems')
  const rightById = new Map(rightItems.map((item) => [item.id, item.text]))
  const leftById = new Map(leftItems.map((item) => [item.id, item.text]))
  const matches = extractMatches(answer)

  return matches
    .map((match) => ({
      left: leftById.get(match.leftId) ?? '',
      right: rightById.get(match.rightId) ?? '',
    }))
    .filter((pair) => pair.left || pair.right)
}

function extractOrderingItems(content: unknown, answer: unknown) {
  const legacyItems = extractStringArrayFromObject(content, 'items')
  if (legacyItems.length > 0) {
    return legacyItems
  }

  const itemList = extractContentItems(content, 'items')
  const itemById = new Map(itemList.map((item) => [item.id, item.text]))
  const orderedIds = extractStringArrayFromObject(answer, 'orderedItemIds')
  const orderedItems = orderedIds.map((id) => itemById.get(id)).filter((item): item is string => Boolean(item))

  return orderedItems.length > 0
    ? orderedItems
    : itemList.map((item) => item.text).filter(Boolean)
}

function extractContentItems(value: unknown, key: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const candidate = (value as Record<string, unknown>)[key]
  if (!Array.isArray(candidate)) {
    return []
  }

  return candidate
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: choiceIdForIndex(index), content: textToRichDocument(item) }
      }

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const record = item as Record<string, unknown>
      return {
        id: String(record.id ?? `${key}-${index + 1}`),
        text: extractRichDocumentText(record.content) || String(record.text ?? record.id ?? ''),
      }
    })
    .filter((item): item is { id: string; text: string } => Boolean(item?.text))
}

function extractMatches(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const matches = (value as Record<string, unknown>).matches
  if (!Array.isArray(matches)) {
    return []
  }

  return matches
    .map((match) => {
      if (!match || typeof match !== 'object' || Array.isArray(match)) {
        return null
      }

      const record = match as Record<string, unknown>
      return {
        leftId: String(record.leftId ?? ''),
        rightId: String(record.rightId ?? ''),
      }
    })
    .filter((match): match is { leftId: string; rightId: string } => Boolean(match?.leftId && match.rightId))
}

function extractChoiceDraftItems(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const candidate = (value as Record<string, unknown>).choices
  if (!Array.isArray(candidate)) {
    return []
  }

  return candidate
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: item, text: item }
      }

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const record = item as Record<string, unknown>
      return {
        id: String(record.id ?? choiceIdForIndex(index)),
        content: isRichContentDocument(record.content)
          ? record.content
          : textToRichDocument(String(record.text ?? record.id ?? '')),
      }
    })
    .filter((item): item is DraftChoice => Boolean(item?.id && richDocumentToPlainText(item.content)))
}

function extractCorrectChoiceIds(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const candidate = (value as Record<string, unknown>).correctChoiceIds
  return Array.isArray(candidate)
    ? candidate.map((item) => String(item)).filter(Boolean)
    : []
}

export function parseJsonUnknown(value: string | undefined): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function extractStemDocumentFromCanonicalContent(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyRichDocument()
  }

  const stem = (value as Record<string, unknown>).stem
  return isRichContentDocument(stem) ? stem : createEmptyRichDocument()
}

function extractRichDocumentText(value: unknown) {
  return isRichContentDocument(value) ? richDocumentToPlainText(value) : ''
}

function isRichContentDocument(value: unknown): value is RichContentDocument {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Array.isArray((value as Record<string, unknown>).blocks),
  )
}

function extractImageAttachments(document: RichContentDocument) {
  const imageAttachments: DraftImageAttachment[] = []

  document.blocks.forEach((block) => {
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      return
    }

    const record = block as Record<string, unknown>
    if (record.type === 'image') {
      const attachmentId = String(record.attachmentId ?? '')
      if (attachmentId) {
        imageAttachments.push({
          id: attachmentId,
          fileName: String(record.caption ?? record.altText ?? 'Image attachment'),
          contentType: 'image/*',
          fileSizeBytes: 0,
          altText: String(record.altText ?? ''),
          caption: String(record.caption ?? ''),
        })
      }
    }
  })

  return imageAttachments
}

function extractPairs(value: unknown): MatchingPairDraft[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }

  const pairs = (value as Record<string, unknown>).pairs
  if (!Array.isArray(pairs)) {
    return []
  }

  return pairs
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const pair = item as Record<string, unknown>
      return {
        left: String(pair.left ?? ''),
        right: String(pair.right ?? ''),
      }
    })
    .filter((pair): pair is MatchingPairDraft => Boolean(pair?.left || pair?.right))
}

function extractPrompt(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? String((value as Record<string, unknown>).prompt ?? '')
    : ''
}

export function normalizeStatus(value: string): Exclude<StatusTab, 'All'> {
  return value.toLowerCase() === 'archived' ? 'Archived' : 'Active'
}

export function safeParseJson(value: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(value) }
  } catch {
    return { ok: false }
  }
}

export function stringifyPreview(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

export function questionMatchesQuery(question: Question, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const currentVersion = getCurrentVersion(question)
  const haystack = [
    question.code,
    question.status,
    ...question.tags,
    currentVersion?.stemPlainText,
    currentVersion?.questionType,
    currentVersion?.difficulty,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}
